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
import { DatePicker } from '@/components/ui/date-picker'
import {
  FileText, 
  User, 
  Upload,
  File,
  Trash2,
  Paperclip,
  Calendar,
  Edit,
  Loader2,
  X
} from "lucide-react"

export function EditeazaInregistrareModal({ 
  isOpen,
  onOpenChange,
  inregistrare,
  departamentId,
  registruId,
  onSuccess 
}) {
  // Funcție pentru truncarea textului
  const truncateText = (text, maxLength = 50) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }
  const [formData, setFormData] = useState({
    expeditor: '',
    destinatarId: '',
    obiect: '',
    observatii: '',
    dataDocument: new Date(),
    dataInregistrare: new Date(),
    tipDocumentId: '',
    numarDocument: '',
    fisierAtas: null
  })
    const [file, setFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [fisierVechiSters, setFisierVechiSters] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()  // Populează formularul cu datele înregistrării când se deschide modalul
  useEffect(() => {
    if (isOpen && inregistrare) {
      console.log('Populez formularul cu:', inregistrare)
      
      // Obține data documentului din primul fișier atașat
      const dataDocument = inregistrare.fisiere?.[0]?.dataFisier 
        ? new Date(inregistrare.fisiere[0].dataFisier)
        : new Date()

      const dataInregistrare = inregistrare.dataInregistrare 
      ? new Date(inregistrare.dataInregistrare) 
      : new Date()
      
      setFormData({
        expeditor: inregistrare.expeditor || '',
        destinatarId: inregistrare.destinatarId?.toString() || '',
        obiect: inregistrare.obiect || '',
        observatii: inregistrare.observatii || '',
        dataDocument: dataDocument,
        dataInregistrare: dataInregistrare,
        tipDocumentId: inregistrare.tipDocumentId?.toString() || '',
        numarDocument: inregistrare.numarDocument || '',
        fisierAtas: inregistrare.fisiere?.[0]?.id || null
      })
      setFile(null)
      setFisierVechiSters(false)
      setIsInitialized(false) // Reset initialization flag
    }
    
    // Când se închide modalul, resetează flag-ul
    if (!isOpen) {
      setIsInitialized(false)
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
      setUploadProgress(0)
      
      const formDataUpload = new FormData()
      formDataUpload.append('file', fileToUpload)
      
      // Adaugă departamentId și registruId pentru organizarea fișierelor
      if (departamentId) {
        formDataUpload.append('departamentId', departamentId)
      }
      if (registruId) {
        formDataUpload.append('registruId', registruId)
      }

      // Determină categoria din tipul de document selectat
      const tipDocumentSelectat = tipuriDocumente.find(tip => tip.id === formData.tipDocumentId)
      console.log('Selected document type in edit modal:', tipDocumentSelectat)
      
      if (tipDocumentSelectat) {
        // Încearcă să obții categoria din tipul de document
        const categorieId = tipDocumentSelectat.categorieId || tipDocumentSelectat.categorie?.id
        console.log('Category ID from document type:', categorieId)
        
        if (categorieId) {
          console.log('Adding category ID to file upload:', categorieId)
          formDataUpload.append('categorieId', categorieId)
        } else {
          console.warn('Document type has no associated category, file will get default category')
        }
      } else {
        console.warn('No document type selected, file will get default category')
      }      // Adaugă informații pentru numele fișierului la editare
      if (inregistrare) {
        formDataUpload.append('numarInregistrare', inregistrare.numarInregistrare)
        formDataUpload.append('isReplacement', 'true') // Marchează că este o înlocuire
        formDataUpload.append('inregistrareId', inregistrare.id) // ID-ul înregistrării pentru a găsi folderul existent
        
        // Dacă există un fișier existent, trimite calea lui pentru a păstra folderul
        if (inregistrare.fisiere?.[0]) {
          formDataUpload.append('existingFilePath', inregistrare.fisiere[0].caleRelativa)
          formDataUpload.append('existingFileId', inregistrare.fisiere[0].id)
        }
        
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
    },    onSuccess: (uploadedFile) => {
      setFile(uploadedFile)
      setFormData(prev => ({ ...prev, fisierAtas: uploadedFile.id }))
      setIsUploading(false)
      setUploadProgress(100)
    },
    onError: (error) => {
      setIsUploading(false)
      setUploadProgress(0)
      notifyError('Eroare la upload: ' + error.message)
    }
  })

  // Mutation pentru actualizarea categoriei fișierului existent
  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, categorieId, departamentId }) => {
      console.log('Updating file category:', { fileId, categorieId, departamentId })
      const response = await axios.patch(`/api/fisiere/${fileId}`, {
        categorieId,
        departamentId
      })
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la actualizarea fișierului')
      }
      return response.data.data
    },
    onSuccess: (data) => {
      console.log('File category updated successfully:', data)
    },
    onError: (error) => {
      console.error('Error updating file category:', error.message)
      notifyError('Eroare la actualizarea categoriei fișierului: ' + error.message)
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
      queryClient.invalidateQueries({ queryKey: ['inregistrari', 'registru', registruId], exact: false })
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
    },
    onSuccess: () => {
      setFormData(prev => ({ ...prev, fisierAtas: null }))
      setFisierVechiSters(true)
      crudNotifications.deleted('Fișierul', inregistrare.fisiere?.[0]?.numeOriginal || 'fișier')
    },    onError: (error) => {
      notifyError('Eroare la ștergerea fișierului: ' + error.message)
    }
  })
  
  const resetForm = () => {
    setFormData({
      expeditor: '',
      destinatarId: '',
      obiect: '',
      observatii: '',
      dataDocument: new Date(),
      dataInregistrare: new Date(),
      tipDocumentId: '',
      numarDocument: '',
      fisierAtas: null
    })
    setFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setFisierVechiSters(false)
    setIsInitialized(false)
  }

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return
    
    // Validare mărime fișier (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      notifyError('Fișierul este prea mare (max 10MB)')
      return
    }
    
    // Validare tip fișier
    const allowedTypes = [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(selectedFile.type)) {
      notifyError('Tip de fișier neacceptat')
      return
    }

    uploadFileMutation.mutate(selectedFile)
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

  const handleRemoveFile = () => {
    if (file?.id) {
      deleteFileMutation.mutate(file.id)
    }
    setFile(null)
    setFormData(prev => ({ ...prev, fisierAtas: null }))
    setUploadProgress(0)
  }

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
    if (!formData.dataDocument) {
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

    // Formatează data corect
    const formatDate = (date) => {
      if (!date) return null;
      if (typeof date === 'string') return date;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dataToSubmit = {
      ...formData,
      departamentId: parseInt(departamentId),
      registruId: parseInt(registruId),
      dataDocument: formatDate(formData.dataDocument),
      tipDocumentId: formData.tipDocumentId || null,
      destinatarId: formData.destinatarId || null,
      fisierAtas: idFisierNou,
      fisierVechiId: fisierVechiId
    }

    editInregistrareMutation.mutate(dataToSubmit)
  }  // Sincronizează tipDocumentId după ce tipuriDocumente s-a încărcat
  useEffect(() => {
    if (
      isOpen &&
      inregistrare &&
      tipuriDocumente.length > 0 &&
      inregistrare.tipDocumentId &&
      !formData.tipDocumentId
    ) {
      setFormData(prev => ({
        ...prev,
        tipDocumentId: inregistrare.tipDocumentId.toString()
      }))
      // Setează flag-ul de inițializare după ce s-a setat tipul de document
      setIsInitialized(true)
    }
  }, [isOpen, inregistrare, tipuriDocumente, formData.tipDocumentId])
  
  // Actualizează categoria fișierului existent DOAR când utilizatorul schimbă manual tipul de document
  useEffect(() => {
    if (
      isInitialized && // Doar după inițializare
      formData.tipDocumentId && 
      tipuriDocumente.length > 0 && 
      inregistrare?.fisiere?.[0]?.id &&
      !file // Nu actualizează dacă există un fișier nou încărcat
    ) {
      const tipDocumentSelectat = tipuriDocumente.find(tip => tip.id === formData.tipDocumentId)
      console.log('Document type manually changed, updating existing file category:', tipDocumentSelectat)
      
      if (tipDocumentSelectat) {
        const categorieId = tipDocumentSelectat.categorieId || tipDocumentSelectat.categorie?.id
        console.log('New category ID for existing file:', categorieId)
        
        if (categorieId) {
          console.log('Updating existing file category...')
          updateFileMutation.mutate({
            fileId: inregistrare.fisiere[0].id,
            categorieId: categorieId,
            departamentId: departamentId
          })
        } else {
          console.warn('Selected document type has no category, keeping current file category')
        }
      }
    }
  }, [isInitialized, formData.tipDocumentId, tipuriDocumente, inregistrare?.fisiere, file, departamentId])

  // Verifică dacă tipul de document este valid
  const isTipDocumentValid = formData.tipDocumentId && formData.tipDocumentId !== ''

  // Obține utilizatorul selectat pentru afișare truncată
  const getSelectedUtilizator = () => {
    if (!formData.destinatarId) return null
    return utilizatori.find(u => u.id === formData.destinatarId)
  }

  // Obține tipul de document selectat pentru afișare truncată  
  const getSelectedTipDocument = () => {
    if (!formData.tipDocumentId) return null
    return tipuriDocumente.find(t => t.id === formData.tipDocumentId)
  }

  if (!inregistrare) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editează Înregistrarea #{inregistrare.numarInregistrare}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rândul 1: Expeditor | Destinatar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expeditor */}
            <div className="space-y-1">
              <Label htmlFor="expeditor" className="text-sm">
                Expeditor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expeditor"
                value={formData.expeditor}
                onChange={(e) => setFormData(prev => ({ ...prev, expeditor: e.target.value }))}
                placeholder="Numele expeditorului"
                required
                className="text-sm"
              />
            </div>

            {/* Destinatar */}
            <div className="space-y-1">
              <Label htmlFor="destinatar" className="text-sm">
                Destinatar <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.destinatarId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, destinatarId: value }))}
                required
              >
                <SelectTrigger className="text-sm h-10 max-w-full">
                  <SelectValue placeholder="Selectează destinatarul" />
                </SelectTrigger>
                <SelectContent>
                  {utilizatori.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()} className="text-sm">
                      {truncateText(`${user.nume} ${user.prenume} ${user.functie && `(${user.functie})`}`, 40)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rândul 2: Tip document | Număr document */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipul de document */}
            <div className="space-y-1">
              <Label htmlFor="tipDocument" className="text-sm">
                Tip Document <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.tipDocumentId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipDocumentId: value }))}
                required
              >
                <SelectTrigger className="text-sm h-10 max-w-full">
                  <SelectValue placeholder="Selectează tipul" />
                </SelectTrigger>
                <SelectContent>
                  {tipuriDocumente.map((tip) => (
                    <SelectItem key={tip.id} value={tip.id.toString()} className="text-sm">
                      {truncateText(`${tip.nume}${tip.categorie ? ` (${tip.categorie.nume})` : ''}`, 45)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Numărul documentului */}
            <div className="space-y-1">
              <Label htmlFor="numarDocument" className="text-sm">
                Numărul documentului <span className="text-red-500">*</span>
              </Label>
              <Input
                id="numarDocument"
                value={formData.numarDocument}
                onChange={(e) => setFormData(prev => ({ ...prev, numarDocument: e.target.value }))}
                placeholder="Numărul documentului"
                required
                className="text-sm"
              />
            </div>
          </div>

          {/* Rândul 3: Obiect | Observații */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Obiect */}
            <div className="space-y-1">
              <Label htmlFor="obiect" className="text-sm">
                Obiect <span className="text-red-500">*</span>
              </Label>
              <Input
                id="obiect"
                value={formData.obiect}
                onChange={(e) => setFormData(prev => ({ ...prev, obiect: e.target.value }))}
                placeholder="Obiectul documentului"
                required
                className="text-sm"
              />
            </div>

            {/* Observații */}
            <div className="space-y-1">
              <Label htmlFor="observatii" className="text-sm">Observații</Label>
              <Input
                id="observatii"
                value={formData.observatii}
                onChange={(e) => setFormData(prev => ({ ...prev, observatii: e.target.value }))}
                placeholder="Observații suplimentare (opțional)"
                className="text-sm"
              />
            </div>
          </div>          {/* Rândul 4: Data document | Data înregistrare */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data documentului */}
            <div className="space-y-1">
              <Label htmlFor="dataDocument" className="text-sm">
                Data documentului <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={formData.dataDocument}
                onChange={(date) => setFormData(prev => ({
                  ...prev,
                  dataDocument: date || new Date()
                }))}
                placeholder="Selectează data documentului"
                className="text-sm"
              />
            </div>

            {/* Data înregistrării */}
            <div className="space-y-1">
              <Label htmlFor="dataInregistrare" className="text-sm">
                Data înregistrării <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={formData.dataInregistrare}
                onChange={(date) => setFormData(prev => ({
                  ...prev,
                  dataInregistrare: date || new Date()
                }))}
                placeholder="Selectează data înregistrării"
                className="text-sm"
                disabled={true}
              />
            </div>
          </div>

          {/* Upload fișier - pe toată lățimea */}
          <div className="space-y-1">
            <Label className="text-sm">
              Fișier atașat <span className="text-red-500">*</span>
            </Label>
            
            {/* Afișează fișierul existent dacă nu a fost șters și nu este încărcat unul nou */}
            {formData.fisierAtas && !file && !fisierVechiSters && (
              <div className="border rounded-lg p-3 bg-blue-50 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-blue-800 text-sm truncate">
                        {truncateText(inregistrare.fisiere?.[0]?.numeOriginal || 'Fișier existent', 30)}
                      </p>
                      <p className="text-xs text-blue-600">Fișier existent</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (inregistrare.fisiere?.[0]?.id) {
                        deleteFileMutation.mutate(inregistrare.fisiere[0].id)
                      } else {
                        setFormData(prev => ({ ...prev, fisierAtas: null }))
                      }
                    }}
                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    disabled={deleteFileMutation.isPending}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Upload zona pentru fișier nou */}
            {(!formData.fisierAtas || fisierVechiSters) && !file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                  ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                  ${!isTipDocumentValid ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => isTipDocumentValid && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                    <p className="text-xs text-gray-600">
                      Se încarcă fișierul... {uploadProgress}%
                    </p>
                    <div className="w-32 bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-600 mb-1">
                      Glisează fișierul aici sau fă click pentru a selecta
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            ) : file ? (
              <div className="border rounded-lg p-3 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-6 h-6 text-green-600" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-green-800 text-sm truncate">
                        {truncateText(file.numeOriginal, 30)}
                      </p>
                      <p className="text-xs text-green-600">
                        {(file.marime / 1024 / 1024).toFixed(2)} MB
                        {file.categorie && ` • ${truncateText(file.categorie.nume, 15)}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Butoane */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={editInregistrareMutation.isPending || isUploading}
              className="flex-1 text-sm"
            >
              {editInregistrareMutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Se salvează...
                </>
              ) : (
                'Salvează Modificările'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={editInregistrareMutation.isPending || isUploading}
              className="text-sm"
            >
              Anulează
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}