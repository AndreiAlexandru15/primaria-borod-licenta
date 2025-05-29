/**
 * Modal pentru adăugarea de documente/înregistrări
 * @fileoverview Modal cu formular pentru crearea de documente noi, cu opțiune de a fi înregistrate sau neînregistrate
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Plus, FileText, Calendar, Building, Hash, User } from "lucide-react"
import { crudNotifications, notifyError } from "@/lib/notifications"
import axios from "axios"

export function AdaugaDocumentModal({ 
  departamentId = null, 
  registruId = null, 
  trigger = null 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    numar: '',
    obiect: '',
    expeditor: '',
    destinatar: '',
    continut: '',
    tip: 'INTRARE',
    urgent: false,
    confidential: false,
    dataDocument: new Date().toISOString().split('T')[0]
  })

  const queryClient = useQueryClient()

  // Query pentru registre disponibile (dacă nu e specificat registruId)
  const { data: registreData } = useQuery({
    queryKey: ['registre', departamentId],
    queryFn: async () => {
      if (!departamentId) return { registre: [] }
      const response = await axios.get(`/api/registru?departmentId=${departamentId}`)
      return response.data.success ? { registre: response.data.data } : { registre: [] }
    },
    enabled: !!departamentId && !registruId,
  })

  // Query pentru departamente (dacă nu e specificat departamentId)
  const { data: departamenteData } = useQuery({
    queryKey: ['departamente'],
    queryFn: async () => {
      const response = await axios.get('/api/departamente')
      return response.data.success ? { departamente: response.data.data } : { departamente: [] }
    },
    enabled: !departamentId,
  })

  // Mutation pentru adăugare document
  const addDocumentMutation = useMutation({
    mutationFn: async (documentData) => {
      const response = await axios.post('/api/documente', documentData)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Nu s-a putut adăuga documentul')
      }
      return response.data.data
    },
    onSuccess: (data) => {
      // Invalidează queries relevante
      queryClient.invalidateQueries({ queryKey: ['documente'] })
      if (registruId) {
        queryClient.invalidateQueries({ queryKey: ['documente', 'registru', registruId] })
      }
      if (departamentId) {
        queryClient.invalidateQueries({ queryKey: ['documente', 'departament', departamentId] })
      }
      
      crudNotifications.created('Documentul', data.obiect)
      resetForm()
      setIsOpen(false)
    },
    onError: (error) => {
      notifyError(error.message)
    }
  })

  const resetForm = () => {
    setFormData({
      numar: '',
      obiect: '',
      expeditor: '',
      destinatar: '',
      continut: '',
      tip: 'INTRARE',
      urgent: false,
      confidential: false,
      dataDocument: new Date().toISOString().split('T')[0]
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.obiect.trim()) {
      notifyError('Obiectul documentului este obligatoriu')
      return
    }

    if (!formData.expeditor.trim() && formData.tip === 'INTRARE') {
      notifyError('Expeditorul este obligatoriu pentru documentele de intrare')
      return
    }

    if (!formData.destinatar.trim() && formData.tip === 'IESIRE') {
      notifyError('Destinatarul este obligatoriu pentru documentele de ieșire')
      return
    }

    const documentData = {
      ...formData,
      departamentId: departamentId || formData.departamentId || null,
      registruId: registruId || formData.registruId || null,
      dataDocument: new Date(formData.dataDocument).toISOString()
    }

    // Elimină câmpurile goale
    Object.keys(documentData).forEach(key => {
      if (documentData[key] === '' || documentData[key] === null) {
        delete documentData[key]
      }
    })

    addDocumentMutation.mutate(documentData)
  }

  const modalTrigger = trigger || (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Adaugă Document
    </Button>
  )

  const registre = registreData?.registre || []
  const departamente = departamenteData?.departamente || []

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {modalTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Adaugă Document Nou
          </DialogTitle>
          <DialogDescription>
            Completează informațiile pentru noul document. Documentele pot fi înregistrate direct în registru sau rămâne neînregistrate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informații de bază */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numar" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Numărul documentului
              </Label>
              <Input
                id="numar"
                value={formData.numar}
                onChange={(e) => setFormData(prev => ({ ...prev, numar: e.target.value }))}
                placeholder="ex: 123/2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tip">Tipul documentului</Label>
              <Select
                value={formData.tip}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tip: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTRARE">Intrare</SelectItem>
                  <SelectItem value="IESIRE">Ieșire</SelectItem>
                  <SelectItem value="INTERN">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obiect" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Obiectul documentului *
            </Label>
            <Input
              id="obiect"
              value={formData.obiect}
              onChange={(e) => setFormData(prev => ({ ...prev, obiect: e.target.value }))}
              placeholder="Descrierea scurtă a documentului"
              required
            />
          </div>

          {/* Expeditor și Destinatar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expeditor" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Expeditor {formData.tip === 'INTRARE' && '*'}
              </Label>
              <Input
                id="expeditor"
                value={formData.expeditor}
                onChange={(e) => setFormData(prev => ({ ...prev, expeditor: e.target.value }))}
                placeholder="Numele expeditorului"
                required={formData.tip === 'INTRARE'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinatar" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Destinatar {formData.tip === 'IESIRE' && '*'}
              </Label>
              <Input
                id="destinatar"
                value={formData.destinatar}
                onChange={(e) => setFormData(prev => ({ ...prev, destinatar: e.target.value }))}
                placeholder="Numele destinatarului"
                required={formData.tip === 'IESIRE'}
              />
            </div>
          </div>

          {/* Data documentului */}
          <div className="space-y-2">
            <Label htmlFor="dataDocument" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data documentului
            </Label>
            <Input
              id="dataDocument"
              type="date"
              value={formData.dataDocument}
              onChange={(e) => setFormData(prev => ({ ...prev, dataDocument: e.target.value }))}
            />
          </div>

          {/* Departament și Registru (doar dacă nu sunt specificate) */}
          {!departamentId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Departament
              </Label>
              <Select
                value={formData.departamentId || ''}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  departamentId: value,
                  registruId: '' // Reset registru când se schimbă departamentul
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează departamentul (opțional)" />
                </SelectTrigger>
                <SelectContent>
                  {departamente.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.nume}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!registruId && registre.length > 0 && (
            <div className="space-y-2">
              <Label>Registru</Label>
              <Select
                value={formData.registruId || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, registruId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează registrul (opțional)" />
                </SelectTrigger>
                <SelectContent>
                  {registre.map((registru) => (
                    <SelectItem key={registru.id} value={registru.id}>
                      {registru.nume} ({registru.cod})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Conținut */}
          <div className="space-y-2">
            <Label htmlFor="continut">Conținutul documentului</Label>
            <Textarea
              id="continut"
              value={formData.continut}
              onChange={(e) => setFormData(prev => ({ ...prev, continut: e.target.value }))}
              placeholder="Descrierea detaliată a conținutului documentului"
              rows={4}
            />
          </div>

          {/* Opțiuni */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgent"
                checked={formData.urgent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, urgent: checked }))}
              />
              <Label htmlFor="urgent" className="text-sm">
                Document urgent
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confidential"
                checked={formData.confidential}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confidential: checked }))}
              />
              <Label htmlFor="confidential" className="text-sm">
                Document confidențial
              </Label>
            </div>
          </div>

          {/* Preview etichete */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{formData.tip}</Badge>
            {formData.urgent && <Badge variant="destructive">Urgent</Badge>}
            {formData.confidential && <Badge variant="secondary">Confidențial</Badge>}
            {!registruId && !formData.registruId && (
              <Badge variant="outline" className="text-orange-600">
                Neînregistrat
              </Badge>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm()
              setIsOpen(false)
            }}
          >
            Anulează
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={addDocumentMutation.isPending}
          >
            {addDocumentMutation.isPending ? 'Se adaugă...' : 'Adaugă Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
