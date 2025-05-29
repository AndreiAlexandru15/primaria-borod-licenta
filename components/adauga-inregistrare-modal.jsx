/**
 * Modal pentru adăugarea de înregistrări în registratură
 * @fileoverview Modal cu formular pentru crearea de înregistrări cu documente atașate
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
import { Plus, FileText, Calendar, Building, Hash, User, X } from "lucide-react"
import { crudNotifications, notifyError } from "@/lib/notifications"
import axios from "axios"

export function AdaugaInregistrareModal({ 
  departamentId = null, 
  registruId = null, 
  trigger = null 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    expeditor: '',
    destinatar: '',
    obiect: '',
    observatii: '',
    urgent: false,
    confidential: false,
    documenteIds: []
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
  // Query pentru documente disponibile (neinregistrate)
  const { data: documenteDisponibile } = useQuery({
    queryKey: ['documente', 'neinregistrate', departamentId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (departamentId) params.append('departmentId', departamentId)
      params.append('neinregistrate', 'true') // Flag pentru documente neinregistrate
      
      const response = await axios.get(`/api/documente?${params}`)
      return response.data.success ? response.data.data?.documente || [] : []
    },
    enabled: !!departamentId || isOpen,
  })

  // Query pentru utilizatori
  const { data: utilizatoriData } = useQuery({
    queryKey: ['utilizatori'],
    queryFn: async () => {
      const response = await axios.get('/api/utilizatori')
      return response.data.success ? response.data.data?.utilizatori || [] : []
    },
    enabled: isOpen,
  })

  // Mutation pentru adăugare înregistrare
  const addInregistrareMutation = useMutation({
    mutationFn: async (inregistrareData) => {
      const response = await axios.post('/api/inregistrari', inregistrareData)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Nu s-a putut adăuga înregistrarea')
      }
      return response.data.data
    },
    onSuccess: (data) => {
      // Invalidează queries relevante
      queryClient.invalidateQueries({ queryKey: ['inregistrari'] })
      if (registruId) {
        queryClient.invalidateQueries({ queryKey: ['inregistrari', 'registru', registruId] })
      }
      if (departamentId) {
        queryClient.invalidateQueries({ queryKey: ['inregistrari', 'departament', departamentId] })
      }
      
      crudNotifications.created('Înregistrarea', data.numarInregistrare)
      resetForm()
      setIsOpen(false)
    },
    onError: (error) => {
      notifyError(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      expeditor: '',
      destinatar: '',
      obiect: '',
      observatii: '',
      urgent: false,
      confidential: false,
      documenteIds: []
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.obiect.trim()) {
      notifyError('Obiectul înregistrării este obligatoriu')
      return
    }

    const selectedRegistruId = registruId || formData.registruId
    if (!selectedRegistruId) {
      notifyError('Registrul este obligatoriu')
      return
    }

    addInregistrareMutation.mutate({
      ...formData,
      registruId: selectedRegistruId
    })
  }

  const handleDocumentToggle = (documentId) => {
    setFormData(prev => ({
      ...prev,
      documenteIds: prev.documenteIds.includes(documentId)
        ? prev.documenteIds.filter(id => id !== documentId)
        : [...prev.documenteIds, documentId]
    }))
  }
  const registre = registreData?.registre || []
  const departamente = departamenteData?.departamente || []
  const documente = documenteDisponibile || []
  const utilizatori = utilizatoriData || []

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Înregistrare
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Adaugă Înregistrare Nouă
          </DialogTitle>
          <DialogDescription>
            Completează formularul pentru a crea o înregistrare în registratură cu documente atașate
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selectare departament și registru */}
          {!departamentId && (
            <div className="space-y-2">
              <Label htmlFor="departament">Departament *</Label>
              <Select 
                value={formData.departamentId || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, departamentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează departamentul" />
                </SelectTrigger>
                <SelectContent>
                  {departamente.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {dept.nume}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!registruId && (
            <div className="space-y-2">
              <Label htmlFor="registru">Registru *</Label>
              <Select 
                value={formData.registruId || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, registruId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează registrul" />
                </SelectTrigger>
                <SelectContent>
                  {registre.map(reg => (
                    <SelectItem key={reg.id} value={reg.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {reg.nume} ({reg.cod})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Expeditor și Destinatar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expeditor">Expeditor</Label>
              <Input
                id="expeditor"
                value={formData.expeditor}
                onChange={(e) => setFormData(prev => ({ ...prev, expeditor: e.target.value }))}
                placeholder="Numele expeditorului"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinatar">Destinatar</Label>
              <Input
                id="destinatar"
                value={formData.destinatar}
                onChange={(e) => setFormData(prev => ({ ...prev, destinatar: e.target.value }))}
                placeholder="Numele destinatarului"
              />
            </div>
          </div>

          {/* Obiect */}
          <div className="space-y-2">
            <Label htmlFor="obiect">Obiect *</Label>
            <Input
              id="obiect"
              value={formData.obiect}
              onChange={(e) => setFormData(prev => ({ ...prev, obiect: e.target.value }))}
              placeholder="Obiectul înregistrării"
              required
            />
          </div>

          {/* Observații */}
          <div className="space-y-2">
            <Label htmlFor="observatii">Observații</Label>
            <Textarea
              id="observatii"
              value={formData.observatii}
              onChange={(e) => setFormData(prev => ({ ...prev, observatii: e.target.value }))}
              placeholder="Observații suplimentare"
              rows={3}
            />
          </div>

          {/* Opțiuni */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgent"
                checked={formData.urgent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, urgent: checked }))}
              />
              <Label htmlFor="urgent" className="text-sm font-medium">
                Urgent
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confidential"
                checked={formData.confidential}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confidential: checked }))}
              />
              <Label htmlFor="confidential" className="text-sm font-medium">
                Confidențial
              </Label>
            </div>
          </div>

          {/* Documente disponibile */}
          {documente.length > 0 && (
            <div className="space-y-2">
              <Label>Documente de atașat</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {documente.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.documenteIds.includes(doc.id)}
                          onCheckedChange={() => handleDocumentToggle(doc.id)}
                        />
                        <div>
                          <p className="font-medium">{doc.obiect}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.numar} • {new Date(doc.dataDocument).toLocaleDateString('ro-RO')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {doc.urgent && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                        {doc.confidential && <Badge variant="secondary" className="text-xs">Confidențial</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {formData.documenteIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.documenteIds.length} document(e) selectat(e)
                </p>
              )}
            </div>
          )}

        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Anulează
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={addInregistrareMutation.isPending}
          >
            {addInregistrareMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Se salvează...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Creează Înregistrarea
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
