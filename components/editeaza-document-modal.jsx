/**
 * Modal pentru editarea documentelor/înregistrărilor
 * @fileoverview Modal cu formular pentru modificarea documentelor existente
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { FileText, Calendar, Building, Hash, User, Edit } from "lucide-react"
import { crudNotifications, notifyError } from "@/lib/notifications"
import axios from "axios"

export function EditeazaDocumentModal({ 
  document,
  isOpen,
  onClose,
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    numar: '',
    obiect: '',
    expeditor: '',
    destinatar: '',
    continut: '',
    tip: 'INTRARE',
    urgent: false,
    confidential: false,
    dataDocument: '',
    departamentId: '',
    registruId: ''
  })

  const queryClient = useQueryClient()

  // Populează formularul când documentul se schimbă
  useEffect(() => {
    if (document) {
      setFormData({
        numar: document.numar || '',
        obiect: document.obiect || '',
        expeditor: document.expeditor || '',
        destinatar: document.destinatar || '',
        continut: document.continut || '',
        tip: document.tip || 'INTRARE',
        urgent: document.urgent || false,
        confidential: document.confidential || false,
        dataDocument: document.dataDocument ? 
          new Date(document.dataDocument).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        departamentId: document.departamentId || '',
        registruId: document.registruId || ''
      })
    }
  }, [document])

  // Query pentru registre disponibile
  const { data: registreData } = useQuery({
    queryKey: ['registre', formData.departamentId],
    queryFn: async () => {
      if (!formData.departamentId) return { registre: [] }
      const response = await axios.get(`/api/registru?departmentId=${formData.departamentId}`)
      return response.data.success ? { registre: response.data.data } : { registre: [] }
    },
    enabled: !!formData.departamentId,
  })

  // Query pentru departamente
  const { data: departamenteData } = useQuery({
    queryKey: ['departamente'],
    queryFn: async () => {
      const response = await axios.get('/api/departamente')
      return response.data.success ? { departamente: response.data.data } : { departamente: [] }
    },
  })

  // Mutation pentru editare document
  const editDocumentMutation = useMutation({
    mutationFn: async (documentData) => {
      const response = await axios.put(`/api/documente/${document.id}`, documentData)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Nu s-a putut actualiza documentul')
      }
      return response.data.data
    },
    onSuccess: (data) => {
      // Invalidează queries relevante
      queryClient.invalidateQueries({ queryKey: ['documente'] })
      queryClient.invalidateQueries({ queryKey: ['document', document.id] })
      if (document.registruId) {
        queryClient.invalidateQueries({ queryKey: ['documente', 'registru', document.registruId] })
      }
      if (document.departamentId) {
        queryClient.invalidateQueries({ queryKey: ['documente', 'departament', document.departamentId] })
      }
      
      crudNotifications.updated('Documentul', data.obiect)
      if (onSuccess) onSuccess(data)
    },
    onError: (error) => {
      notifyError(error.message)
    }
  })

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
      dataDocument: new Date(formData.dataDocument).toISOString()
    }

    // Elimină câmpurile goale
    Object.keys(documentData).forEach(key => {
      if (documentData[key] === '') {
        documentData[key] = null
      }
    })

    editDocumentMutation.mutate(documentData)
  }

  const registre = registreData?.registre || []
  const departamente = departamenteData?.departamente || []

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editează Document
          </DialogTitle>
          <DialogDescription>
            Modifică informațiile documentului. Schimbările vor fi salvate imediat.
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

          {/* Departament și Registru */}
          <div className="space-y-4">
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
                  <SelectItem value="">Fără departament</SelectItem>
                  {departamente.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.nume}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.departamentId && (
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
                    <SelectItem value="">Fără registru</SelectItem>
                    {registre.map((registru) => (
                      <SelectItem key={registru.id} value={registru.id}>
                        {registru.nume} ({registru.cod})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

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
            {!formData.registruId && (
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
            onClick={onClose}
          >
            Anulează
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={editDocumentMutation.isPending}
          >
            {editDocumentMutation.isPending ? 'Se salvează...' : 'Salvează Modificările'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
