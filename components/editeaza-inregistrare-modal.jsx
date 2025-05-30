/**
 * Modal pentru editarea înregistrărilor
 * @fileoverview Modal cu formular pentru editarea înregistrărilor existente
 */

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { notifyError, crudNotifications } from '@/lib/notifications'
import {
  FileText, 
  User, 
  Upload,
  File,
  Trash2,
  Paperclip,
  Calendar,
  Edit
} from "lucide-react"

export function EditeazaInregistrareModal({ 
  isOpen,
  onOpenChange,
  inregistrare,
  departamentId,
  registruId,
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    expeditor: '',
    destinatarId: '',
    obiect: '',    observatii: '',
    dataDocument: '',
    tipDocumentId: '',
    numarDocument: '',
  })
  
  const [file, setFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [fisierVechiSters, setFisierVechiSters] = useState(false) // urmărește dacă fișierul vechi a fost șters manual
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()
  // Populează formularul cu datele înregistrării când se deschide modalul
  useEffect(() => {
    if (isOpen && inregistrare) {
      console.log('Populez formularul cu:', inregistrare)
      console.log('tipDocumentId din inregistrare:', inregistrare.tipDocumentId)
      
      // Obține data documentului din primul fișier atașat
      const dataDocument = inregistrare.fisiere?.[0]?.dataFisier 
        ? new Date(inregistrare.fisiere[0].dataFisier).toISOString().split('T')[0] 
        : '';
        setFormData({
        expeditor: inregistrare.expeditor || '',
        destinatarId: inregistrare.destinatarId?.toString() || '',
        obiect: inregistrare.obiect || '',
        observatii: inregistrare.observatii || '',
        dataDocument: dataDocument,
        tipDocumentId: inregistrare.tipDocumentId?.toString() || '',
        numarDocument: inregistrare.numarDocument || '',
        fisierAtas: inregistrare.fisiere?.[0]?.id || null // presupunem un singur fișier
      })
      setFile(null)
      setFisierVechiSters(false) // resetează când se deschide modalul
    }
  }, [isOpen, inregistrare])
    // Query pentru tipurile de documente ale registrului
  const { data: tipuriDocumente = [] } = useQuery({
    queryKey: ['tipuri-documente', registruId],
    queryFn: async () => {
      if (!registruId) return []
      const response = await axios.get(`/api/tipuri-documente?registruId=${registruId}`)
      console.log('Tipuri documente încărcate:', response.data.data)
      return response.data.success ? response.data.data : []
    },
    enabled: !!registruId && isOpen
  })
  
  // Query pentru utilizatori
  const { data: utilizatori = [] } = useQuery({
    queryKey: ['utilizatori', departamentId],
    queryFn: async () => {
      if (!departamentId) return [];
      const response = await axios.get('/api/utilizatori');
      if (!response.data.success) throw new Error('Nu s-au putut încărca utilizatorii');
      return response.data.data;
    },
    enabled: isOpen && !!departamentId
  })
  // Mutation pentru upload fișier
  const uploadFileMutation = useMutation({
    mutationFn: async (fileToUpload) => {
      setIsUploading(true)
      
      const formDataUpload = new FormData()
      formDataUpload.append('file', fileToUpload)
      
      // Adaugă departamentId și registruId pentru organizarea fișierelor
      if (departamentId) {
        formDataUpload.append('departamentId', departamentId)
      }
      if (registruId) {
        formDataUpload.append('registruId', registruId)
      }
        // Adaugă informații pentru numele fișierului la editare
      if (inregistrare) {
        formDataUpload.append('numarInregistrare', inregistrare.numarInregistrare)
        // Folosește numele fișierului fără extensie
        const numeDocument = fileToUpload.name.split('.')[0]
        formDataUpload.append('numeDocument', numeDocument)
      }
      
      const response = await axios.post('/api/fisiere', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        },
      })
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la upload')
      }
      
      return response.data.data
    },
    onSuccess: (uploadedFile) => {
      setFormData(prev => ({ ...prev, fisierAtas: uploadedFile.id }))
      setIsUploading(false)
      setUploadProgress(0)
    },
    onError: (error) => {
      setIsUploading(false)
      setUploadProgress(0)
      notifyError('Eroare la upload: ' + error.message)
    }
  })
  // Mutation pentru editarea înregistrării
  const editInregistrareMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.put(`/api/inregistrari/${inregistrare.id}`, data)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la editarea înregistrării')
      }
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['inregistrari'])
      crudNotifications.edit('Înregistrarea', data.numarInregistrare)
      onOpenChange(false)
      resetForm()
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      notifyError('Eroare la editarea înregistrării: ' + error.message)
    }
  })

  // Mutation pentru ștergerea fișierului existent
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId) => {
      const response = await axios.delete(`/api/fisiere/${fileId}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la ștergerea fișierului')
      }
      return response.data
    },    onSuccess: () => {
      setFormData(prev => ({ ...prev, fisierAtas: null }))
      setFisierVechiSters(true) // marchează că fișierul vechi a fost șters manual
      crudNotifications.deleted('Fișierul', inregistrare.fisiere?.[0]?.numeOriginal || 'fișier')
    },
    onError: (error) => {
      notifyError('Eroare la ștergerea fișierului: ' + error.message)
    }
  })
  const resetForm = () => {
    setFormData({
      expeditor: '',
      destinatarId: '',
      obiect: '',
      observatii: '',
      dataDocument: '',
      tipDocumentId: '',
      numarDocument: '',
    })
    setFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setFisierVechiSters(false) // resetează și această variabilă
  }

  const handleFileSelect = useCallback((selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile)
      uploadFileMutation.mutate(selectedFile)
    }
  }, [uploadFileMutation])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.expeditor.trim()) {
      notifyError('Expeditorul este obligatoriu')
      return
    }
    if (!formData.destinatarId || !formData.destinatarId.trim()) {
      notifyError('Destinatarul este obligatoriu')
      return
    }
    if (!formData.obiect.trim()) {
      notifyError('Obiectul este obligatoriu')
      return
    }
    if (!formData.numarDocument.trim()) {
      notifyError('Numărul documentului este obligatoriu')
      return
    }
    if (!formData.dataDocument || !formData.dataDocument.trim()) {
      notifyError('Data documentului este obligatorie')
      return
    }
    if (!formData.tipDocumentId || !formData.tipDocumentId.trim()) {
      notifyError('Tipul documentului este obligatoriu')
      return
    }
    if (!formData.fisierAtas) {
      notifyError('Este obligatoriu să atașați un fișier!')
      return
    }
    // Determină dacă trebuie șters fișierul vechi
    const idFisierVechi = inregistrare.fisiere?.[0]?.id || null
    const idFisierNou = formData.fisierAtas || null
    let fisierVechiId = null
    if (!fisierVechiSters && idFisierVechi && idFisierNou && idFisierVechi !== idFisierNou) {
      fisierVechiId = idFisierVechi
    }
    const dataToSubmit = {
      ...formData,
      departamentId: parseInt(departamentId),
      registruId: parseInt(registruId),
      dataDocument: formData.dataDocument || null,
      tipDocumentId: formData.tipDocumentId || null,
      destinatarId: formData.destinatarId || null,
      fisierAtas: idFisierNou,
      fisierVechiId: fisierVechiId
    }

    editInregistrareMutation.mutate(dataToSubmit)
  }

  const removeFile = () => {
    setFile(null)
    setFormData(prev => ({ ...prev, fisierAtas: null }))
  }  // Sincronizează tipDocumentId după ce tipuriDocumente s-a încărcat
  useEffect(() => {
    console.log('Verificare sincronizare tip document:', {
      isOpen,
      inregistrare: !!inregistrare,
      tipuriDocumenteLength: tipuriDocumente.length,
      inregistrareTipDocumentId: inregistrare?.tipDocumentId,
      formDataTipDocumentId: formData.tipDocumentId
    })
    
    if (
      isOpen &&
      inregistrare &&
      tipuriDocumente.length > 0 &&
      inregistrare.tipDocumentId &&
      !formData.tipDocumentId
    ) {
      console.log('Setez tipDocumentId din inregistrare:', inregistrare.tipDocumentId)
      setFormData(prev => ({
        ...prev,
        tipDocumentId: inregistrare.tipDocumentId.toString()
      }))
    }
  }, [isOpen, inregistrare, tipuriDocumente, formData.tipDocumentId])
  // Corectează formatul datei dacă nu este deja string YYYY-MM-DD
  useEffect(() => {
    if (
      isOpen &&
      inregistrare &&
      inregistrare.fisiere?.[0]?.dataFisier &&
      (typeof formData.dataDocument !== 'string' || formData.dataDocument.length !== 10)
    ) {
      setFormData(prev => ({
        ...prev,
        dataDocument: new Date(inregistrare.fisiere[0].dataFisier).toISOString().split('T')[0]
      }))
    }
  }, [isOpen, inregistrare, formData.dataDocument])

  if (!inregistrare) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editează Înregistrarea #{inregistrare.numarInregistrare}
          </DialogTitle>
          <DialogDescription>
            Modifică datele înregistrării din registru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expeditor">
                Expeditor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expeditor"
                value={formData.expeditor}
                onChange={(e) => setFormData(prev => ({ ...prev, expeditor: e.target.value }))}
                placeholder="Numele expeditorului"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinatar">Destinatar <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.destinatarId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, destinatarId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează destinatarul" />
                </SelectTrigger>
                <SelectContent>
                  {utilizatori.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.nume} {user.prenume} {user.functie && `(${user.functie})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obiect">
              Obiect <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="obiect"
              value={formData.obiect}
              onChange={(e) => setFormData(prev => ({ ...prev, obiect: e.target.value }))}
              placeholder="Obiectul înregistrării"
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observatii">Observații</Label>
            <Textarea
              id="observatii"
              value={formData.observatii}
              onChange={(e) => setFormData(prev => ({ ...prev, observatii: e.target.value }))}
              placeholder="Observații suplimentare"
              className="min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numarDocument">Număr Document <span className="text-red-500">*</span></Label>
              <Input
                id="numarDocument"
                value={formData.numarDocument}
                onChange={(e) => setFormData(prev => ({ ...prev, numarDocument: e.target.value }))}
                placeholder="Nr. document"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataDocument">Data Document <span className="text-red-500">*</span></Label>
              <Input
                id="dataDocument"
                type="date"
                value={formData.dataDocument}
                onChange={(e) => setFormData(prev => ({ ...prev, dataDocument: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipDocument">Tip Document <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.tipDocumentId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipDocumentId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează tipul" />
                </SelectTrigger>                <SelectContent>
                  {tipuriDocumente.map((tip) => (
                    <SelectItem key={tip.id} value={tip.id.toString()}>
                      {tip.nume}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>Fișier Atașat <span className="text-red-500">*</span></Label>
            {formData.fisierAtas && !file && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded w-full mb-2">
                <File className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium flex-1 text-left">
                  {inregistrare.fisiere?.[0]?.numeOriginal || 'Fișier existent'}
                </span>                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (inregistrare.fisiere?.[0]?.id) {
                      deleteFileMutation.mutate(inregistrare.fisiere[0].id)
                    } else {
                      setFormData(prev => ({ ...prev, fisierAtas: null }))
                    }
                  }}
                  className="h-6 w-6 p-0"
                  disabled={deleteFileMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Card 
              className={`border-2 border-dashed transition-colors ${
                isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                {isUploading ? (
                  <div className="w-full space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-blue-500 animate-pulse" />
                    <p className="text-sm text-gray-600">Se încarcă fișierul...</p>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-xs text-gray-500">{uploadProgress}%</p>
                  </div>
                ) : file ? (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded w-full">
                    <File className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium flex-1 text-left">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Trage și lasă un fișier aici sau{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto font-semibold"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          selectează
                        </Button>
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (max. 10MB)</p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile) handleFileSelect(selectedFile)
                  }}
                  // required eliminat pentru a permite submit dacă există deja un fișier atașat
                />
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Anulează
            </Button>
            <Button 
              type="submit"
              disabled={editInregistrareMutation.isPending || isUploading}
            >
              {editInregistrareMutation.isPending ? 'Se salvează...' : 'Salvează Modificările'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
