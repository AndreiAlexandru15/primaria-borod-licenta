/**
 * Modal pentru adăugarea de înregistrări în registratură
 * @fileoverview Modal cu formular pentru crearea de înregistrări cu un singur fișier atașat
 * Departamentul și registrul sunt preluate automat din props și trimise către API
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
  DialogTrigger,
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
import { 
  Plus, 
  FileText, 
  User, 
  Upload,
  File,
  Trash2,
  Paperclip,
  Calendar
} from "lucide-react"
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
    destinatarId: '', // store user ID
    obiect: '',
    observatii: '',
    dataDocument: new Date().toISOString().split('T')[0],
    tipDocumentId: '',
    fisierAtas: null
  })
  const [file, setFile] = useState(null)  
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()
  
  // Query pentru tipurile de documente ale registrului
  const { data: tipuriDocumente = [] } = useQuery({
    queryKey: ['tipuri-documente', registruId],
    queryFn: async () => {
      if (!registruId) return []
      const response = await axios.get(`/api/tipuri-documente?registruId=${registruId}`)
      return response.data.success ? response.data.data : []
    },
    enabled: !!registruId
  })
  
  // Fetch users for the department
  const { data: utilizatori = [], isLoading: utilizatoriLoading, error: utilizatoriError } = useQuery({
    queryKey: ['utilizatori', departamentId],
    queryFn: async () => {
      if (!departamentId) return [];
      const response = await axios.get('/api/utilizatori');
      if (!response.data.success) throw new Error('Nu s-au putut încărca utilizatorii');
      // Returnează toți utilizatorii, fără filtrare după departament
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
      
      setUploadProgress(0)

      try {
        const response = await axios.post('/api/fisiere', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress(percentCompleted)
          }
        })

        if (response.data.success) {
          return {
            id: response.data.data.id,
            numeOriginal: response.data.data.numeOriginal,
            marime: response.data.data.marime,
            tipMime: response.data.data.tipMime
          }
        } else {
          throw new Error(response.data.error || 'Eroare la încărcarea fișierului')
        }
      } catch (error) {
        throw new Error(error.response?.data?.error || 'Eroare la încărcarea fișierului')
      } finally {
        setIsUploading(false)
      }
    },
    onSuccess: (uploadedFile) => {
      setFile(uploadedFile)
      setFormData(prev => ({
        ...prev,
        fisierAtas: uploadedFile.id
      }))
    },
    onError: (error) => {
      notifyError(error.message)
      setUploadProgress(0)
    }
  })

  // Mutation pentru ștergere fișier
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId) => {
      await axios.delete(`/api/fisiere/${fileId}`)
    },
    onError: (error) => {
      notifyError('Eroare la ștergerea fișierului')
    }
  })  // Mutation pentru creare înregistrare
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        registruId,
        departamentId,
        fisiereIds: data.fisierAtas ? [data.fisierAtas] : []
      }
      delete payload.fisierAtas
      // Remove destinatar if present, only send destinatarId
      if (payload.destinatar) delete payload.destinatar
      
      const response = await axios.post('/api/inregistrari', payload)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la crearea înregistrării')
      }
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inregistrari'] })
      if (registruId) {
        queryClient.invalidateQueries({ queryKey: ['registru', registruId] })
      }
      if (departamentId) {
        queryClient.invalidateQueries({ queryKey: ['departament', departamentId] })
      }
      crudNotifications.created('înregistrarea', data.numarInregistrare)
      setIsOpen(false)
      resetForm()
    },
    onError: (error) => {
      notifyError(error.message)
    }
  })

  const resetForm = () => {
    setFormData({
      expeditor: '',
      destinatarId: '',
      obiect: '',
      observatii: '',
      dataDocument: new Date().toISOString().split('T')[0],
      tipDocumentId: '',
      fisierAtas: null
    })
    setFile(null)
    setUploadProgress(0)
    setIsUploading(false)
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.tipDocumentId) {
      notifyError('Tipul de document este obligatoriu')
      return
    }
    if (!formData.obiect.trim()) {
      notifyError('Obiectul este obligatoriu')
      return
    }
    if (!departamentId || !registruId) {
      notifyError('Departamentul și registrul sunt obligatorii pentru a crea înregistrarea')
      return
    }
    if (!formData.destinatarId) {
      notifyError('Destinatarul este obligatoriu')
      return
    }
    // Trimit datele cu departamentId și registruId incluse automat
    createMutation.mutate(formData)
  }

  // Funcții pentru drag & drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      // Folosim doar primul fișier
      uploadFileMutation.mutate(droppedFiles[0])
    }
  }, [uploadFileMutation])

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      // Folosim doar primul fișier
      uploadFileMutation.mutate(selectedFiles[0])
    }
  }

  const removeFile = () => {
    if (file?.id) {
      deleteFileMutation.mutate(file.id)
    }
    setFile(null)
    setFormData(prev => ({
      ...prev,
      fisierAtas: null
    }))
    setUploadProgress(0)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Setează destinatarId la responsabilul departamentului dacă există
  useEffect(() => {
    if (isOpen && utilizatori.length > 0 && departamentId) {
      axios.get(`/api/departamente`).then(res => {
        if (res.data.success) {
          const dep = res.data.data.find(d => d.id === departamentId);
          let responsabilId = dep?.responsabil?.id || null;
          let destinatarValid = utilizatori.some(u => u.id === formData.destinatarId);
          // Dacă destinatarId nu e valid sau e gol, setează responsabilul dacă există în listă, altfel primul utilizator
          if (!destinatarValid) {
            let newDestinatarId = (responsabilId && utilizatori.some(u => u.id === responsabilId))
              ? responsabilId
              : utilizatori[0].id;
            setFormData(prev => ({ ...prev, destinatarId: newDestinatarId }));
          }
        }
      });
    }
    if (!isOpen && formData.destinatarId !== '') {
      setFormData(prev => ({ ...prev, destinatarId: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, utilizatori, departamentId])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adaugă Înregistrare
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Înregistrare Nouă
          </DialogTitle>
          <DialogDescription>
            Completează datele pentru noua înregistrare în registratură
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expeditor */}
          <div className="space-y-2">
            <Label htmlFor="expeditor" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Expeditor
            </Label>
            <Input
              id="expeditor"
              value={formData.expeditor}
              onChange={(e) => setFormData(prev => ({ ...prev, expeditor: e.target.value }))}
              placeholder="Nume expeditor sau instituție"
            />
          </div>

          {/* Destinatar (dropdown) */}
          <div className="space-y-2">
            <Label htmlFor="destinatarId" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Destinatar *
            </Label>
            <Select
              value={formData.destinatarId && utilizatori.some(u => u.id?.toString() === formData.destinatarId?.toString()) ? formData.destinatarId.toString() : undefined}
              onValueChange={val => setFormData(prev => ({ ...prev, destinatarId: val }))}
              required
              name="destinatarId"
              disabled={utilizatoriLoading || utilizatori.length === 0}
            >
              <SelectTrigger id="destinatarId">
                <SelectValue placeholder={utilizatoriLoading ? 'Se încarcă utilizatorii...' : 'Selectează destinatarul'} />
              </SelectTrigger>
              <SelectContent>
                {utilizatori.length > 0 && utilizatori
                  .filter(u => u.id !== undefined && u.id !== null && u.id.toString() !== "")
                  .map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.nume} {u.prenume} - {u.functie || 'Fără funcție'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {utilizatori.length === 0 && !utilizatoriLoading && (
              <p className="text-xs text-gray-500">Niciun utilizator disponibil în acest departament.</p>
            )}
          </div>

          {/* Obiect */}
          <div className="space-y-2">
            <Label htmlFor="obiect" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Obiect *
            </Label>
            <Textarea
              id="obiect"
              value={formData.obiect}
              onChange={(e) => setFormData(prev => ({ ...prev, obiect: e.target.value }))}
              placeholder="Descrierea obiectului documentului"
              required
              rows={3}
            />
          </div>

          {/* Observații */}
          <div className="space-y-2">
            <Label htmlFor="observatii" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observații
            </Label>
            <Textarea
              id="observatii"
              value={formData.observatii}
              onChange={(e) => setFormData(prev => ({ ...prev, observatii: e.target.value }))}
              placeholder="Observații suplimentare"
              rows={2}
            />
          </div>

          {/* Data Document */}
          <div className="space-y-2">
            <Label htmlFor="dataDocument" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data Document
            </Label>
            <Input
              id="dataDocument"
              type="date"
              value={formData.dataDocument}
              onChange={(e) => setFormData(prev => ({ ...prev, dataDocument: e.target.value }))}
            />
          </div>

          {/* Tip Document */}
          <div className="space-y-2">
            <Label htmlFor="tipDocumentId" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tip document *
            </Label>
            <Select
              value={formData.tipDocumentId}
              onValueChange={val => setFormData(prev => ({ ...prev, tipDocumentId: val }))}
              required
              name="tipDocumentId"
            >
              <SelectTrigger id="tipDocumentId">
                <SelectValue placeholder="Selectează tipul documentului" />
              </SelectTrigger>
              <SelectContent>
                {tipuriDocumente.length === 0 ? (
                  <SelectItem value="" disabled>
                    Niciun tip disponibil
                  </SelectItem>
                ) : (
                  tipuriDocumente.map(tip => (
                    <SelectItem key={tip.id} value={tip.id}>
                      {tip.nume}
                    </SelectItem>
                  ))
               ) }
              </SelectContent>
            </Select>
          </div>

          {/* Upload Zone */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Fișier Atașat
            </Label>
            
            {!file ? (
              <Card
                className={`border-2 border-dashed transition-colors ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Trage fișierul aici sau{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary underline hover:no-underline"
                    >
                      navighează pentru a selecta
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    Orice tip de fișier (fără limită de mărime)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>
            ) : null}

            {/* Progress bar pentru upload */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="truncate">Se încarcă fișierul...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Fișierul încărcat */}
            {file && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fișier atașat:</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <File className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{file.numeOriginal}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.marime)} • {file.tipMime}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700"
                    disabled={isUploading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Anulează
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || isUploading}
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Se salvează...
                </>
              ) : isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Se încarcă fișierul...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Creează Înregistrarea
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

