'use client'

import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { notifySuccess, notifyError } from '@/lib/notifications'

export function AdaugaInregistrareModal({ 
  departamentId = null, 
  registruId = null,
  trigger = null 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    expeditor: '',
    destinatarId: 'placeholder',
    obiect: '',
    observatii: '',
    dataDocument: new Date().toISOString().split('T')[0],
    tipDocumentId: 'placeholder',
    fisierAtas: null,
    numarDocument: '',
  })
  const [file, setFile] = useState(null)  
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()
  
  // Query pentru categorii fișiere (pentru fallback dacă tipul de document nu are categorie)
  const { data: categorii = [] } = useQuery({
    queryKey: ['categorii-document'],
    queryFn: async () => {
      const response = await axios.get('/api/categorii-document')
      return response.data.success ? response.data.data : []
    }
  })
  
  // Query pentru tipurile de documente ale registrului (cu categorii incluse)
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
  const { data: utilizatori = [], isLoading: utilizatoriLoading } = useQuery({
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
      
      // Adaugă departamentId pentru organizarea fișierelor
      if (departamentId) {
        formDataUpload.append('departamentId', departamentId)
      }
      
      // Folosește categoria din tipul de document selectat
      const tipDocumentSelectat = tipuriDocumente.find(tip => tip.id === formData.tipDocumentId)
      if (tipDocumentSelectat?.categorieId) {
        formDataUpload.append('categorieId', tipDocumentSelectat.categorieId)
      } else if (categorii.length > 0) {
        // Fallback la prima categorie dacă tipul de document nu are categorie
        formDataUpload.append('categorieId', categorii[0].id)
      }

      try {
        const response = await axios.post('/api/fisiere', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setUploadProgress(percentCompleted)
            }
          }
        })

        if (response.data.success) {
          return {
            id: response.data.data.id,
            numeOriginal: response.data.data.numeOriginal,
            marime: response.data.data.marime,
            tipMime: response.data.data.tipMime,
            extensie: response.data.data.extensie,
            categorie: response.data.data.categorie
          }
        } else {
          throw new Error(response.data.error || 'Eroare la încărcarea fișierului')
        }
      } catch (error) {
        console.error('Upload error:', error)
        throw new Error(error.response?.data?.error || error.message || 'Eroare la încărcarea fișierului')
      } finally {
        setIsUploading(false)
      }
    },
    onSuccess: (uploadedFile) => {
      console.log('Upload success:', uploadedFile)
      setFile(uploadedFile)
      setFormData(prev => ({
        ...prev,
        fisierAtas: uploadedFile.id
      }))
      setUploadProgress(100)
    },
    onError: (error) => {
      console.error('Upload mutation error:', error)
      notifyError(error.message)
      setUploadProgress(0)
      setIsUploading(false)
    }
  })

  // Mutation pentru ștergere fișier
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId) => {
      const response = await axios.delete(`/api/fisiere?id=${fileId}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la ștergerea fișierului')
      }
      return response.data
    },
    onSuccess: () => {
      console.log('File deleted successfully')
    },
    onError: (error) => {
      console.error('Delete file error:', error)
      notifyError(error.message || 'Eroare la ștergerea fișierului')
    }
  })
  
  // Mutation pentru creare înregistrare
  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Curăță datele de valorile placeholder
      const cleanData = {
        ...data,
        tipDocumentId: data.tipDocumentId === 'placeholder' ? null : data.tipDocumentId,
        destinatarId: data.destinatarId === 'placeholder' ? null : data.destinatarId,
      }
      
      const payload = {
        ...cleanData,
        registruId,
        departamentId,
        fisiereIds: cleanData.fisierAtas ? [cleanData.fisierAtas] : []
      }
      delete payload.fisierAtas
      
      console.log('Creating registration with payload:', payload)
      
      const response = await axios.post('/api/inregistrari', payload)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la crearea înregistrării')
      }
      return response.data
    },
    onSuccess: (data) => {
      console.log('Registration created successfully:', data)
      notifySuccess('Înregistrarea a fost creată cu succes!')
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['inregistrari'] })
      queryClient.invalidateQueries({ queryKey: ['fisiere'] })
      
      resetForm()
      setIsOpen(false)
    },
    onError: (error) => {
      console.error('Create registration error:', error)
      notifyError(error.message || 'Nu s-a putut crea înregistrarea')
    }
  })

  const resetForm = () => {
    setFormData({
      expeditor: '',
      destinatarId: 'placeholder',
      obiect: '',
      observatii: '',
      dataDocument: new Date().toISOString().split('T')[0],
      tipDocumentId: 'placeholder',
      fisierAtas: null,
      numarDocument: '',
    })
    setFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setIsDragOver(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validări
    if (!formData.tipDocumentId || formData.tipDocumentId === 'placeholder') {
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
    if (!formData.destinatarId || formData.destinatarId === 'placeholder') {
      notifyError('Destinatarul este obligatoriu')
      return
    }
    if (!formData.fisierAtas) {
      notifyError('Fișierul atașat este obligatoriu')
      return
    }
    
    console.log('Submitting form with data:', formData)
    createMutation.mutate(formData)
  }

  const handleFileSelect = (selectedFile) => {
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

    // Verifică dacă tipul de document este selectat
    if (!formData.tipDocumentId || formData.tipDocumentId === 'placeholder') {
      notifyError('Selectează mai întâi tipul de document')
      return
    }
    
    uploadFileMutation.mutate(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleRemoveFile = () => {
    if (file?.id) {
      deleteFileMutation.mutate(file.id)
    }
    setFile(null)
    setFormData(prev => ({ ...prev, fisierAtas: null }))
    setUploadProgress(0)
  }

  // Obține categoria pentru tipul de document selectat
  const getCategorieForTipDocument = (tipDocumentId) => {
    if (!tipDocumentId || tipDocumentId === 'placeholder') return null
    const tipDocument = tipuriDocumente.find(tip => tip.id === tipDocumentId)
    return tipDocument?.categorie || null
  }

  // Verifică dacă tipul de document este valid
  const isTipDocumentValid = formData.tipDocumentId && formData.tipDocumentId !== 'placeholder'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Adaugă înregistrare
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adaugă înregistrare nouă</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipul de document */}
          <div className="space-y-2">
            <Label htmlFor="tipDocumentId">
              Tipul de document <span className="text-red-500">*</span>
            </Label>
            <select
              id="tipDocumentId"
              value={formData.tipDocumentId}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                tipDocumentId: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="placeholder" disabled>Selectează tipul de document</option>
              {tipuriDocumente.map(tip => (
                <option key={tip.id} value={tip.id}>
                  {tip.nume} {tip.categorie && `(${tip.categorie.nume})`}
                </option>
              ))}
            </select>
            
            {/* Afișează informații despre categoria selectată */}
            {isTipDocumentValid && (() => {
              const categorie = getCategorieForTipDocument(formData.tipDocumentId)
              return categorie && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border">
                  <div className="font-medium text-blue-800">
                    📁 Categoria: {categorie.nume}
                  </div>
                  {categorie.descriere && (
                    <div className="mt-1">
                      <span className="font-medium">Descriere:</span> {categorie.descriere}
                    </div>
                  )}
                  {categorie.perioadaRetentie && (
                    <div className="mt-1">
                      <span className="font-medium">Perioada retenție:</span> {categorie.perioadaRetentie} ani
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Expeditor */}
          <div className="space-y-2">
            <Label htmlFor="expeditor">
              Expeditor <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expeditor"
              value={formData.expeditor}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                expeditor: e.target.value
              }))}
              placeholder="Numele expeditorului"
              required
            />
          </div>

          {/* Destinatar */}
          <div className="space-y-2">
            <Label htmlFor="destinatarId">
              Destinatar <span className="text-red-500">*</span>
            </Label>
            <select
              id="destinatarId"
              value={formData.destinatarId}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                destinatarId: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="placeholder" disabled>Selectează destinatarul</option>
              {utilizatori.map(utilizator => (
                <option key={utilizator.id} value={utilizator.id}>
                  {utilizator.nume} {utilizator.prenume} ({utilizator.functie})
                </option>
              ))}
            </select>
          </div>

          {/* Obiect */}
          <div className="space-y-2">
            <Label htmlFor="obiect">
              Obiect <span className="text-red-500">*</span>
            </Label>
            <Input
              id="obiect"
              value={formData.obiect}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                obiect: e.target.value
              }))}
              placeholder="Obiectul documentului"
              required
            />
          </div>

          {/* Numărul documentului */}
          <div className="space-y-2">
            <Label htmlFor="numarDocument">Numărul documentului</Label>
            <Input
              id="numarDocument"
              value={formData.numarDocument}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                numarDocument: e.target.value
              }))}
              placeholder="Numărul documentului (opțional)"
            />
          </div>

          {/* Data documentului */}
          <div className="space-y-2">
            <Label htmlFor="dataDocument">
              Data documentului <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dataDocument"
              type="date"
              value={formData.dataDocument}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dataDocument: e.target.value
              }))}
              required
            />
          </div>

          {/* Upload fișier */}
          <div className="space-y-2">
            <Label>
              Fișier atașat <span className="text-red-500">*</span>
            </Label>
            
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
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
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">
                      Se încarcă fișierul... {uploadProgress}%
                    </p>
                    <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      {isTipDocumentValid 
                        ? 'Glisează fișierul aici sau fă click pentru a selecta'
                        : 'Selectează mai întâi tipul de document'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{file.numeOriginal}</p>
                      <p className="text-sm text-green-600">
                        {(file.marime / 1024 / 1024).toFixed(2)} MB
                        {file.categorie && ` • ${file.categorie.nume}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Observații */}
          <div className="space-y-2">
            <Label htmlFor="observatii">Observații</Label>
            <Textarea
              id="observatii"
              value={formData.observatii}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                observatii: e.target.value
              }))}
              placeholder="Observații suplimentare (opțional)"
              rows={3}
            />
          </div>

          {/* Butoane */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || isUploading}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se creează...
                </>
              ) : (
                'Creează înregistrarea'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                setIsOpen(false)
              }}
              disabled={createMutation.isPending || isUploading}
            >
              Anulează
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}