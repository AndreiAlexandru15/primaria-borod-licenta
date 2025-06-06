/**
 * Modal pentru adăugarea unui departament nou
 * @fileoverview Componentă modal pentru crearea departamentelor cu toate câmpurile necesare
 */

"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Plus, Building2, User, Phone, Mail, Hash } from "lucide-react"
import { 
  notifySuccess, 
  notifyError, 
  notifyWarning, 
  notifyLoading, 
  dismissNotification,
  crudNotifications,
  validationNotifications 
} from "@/lib/notifications"
import axios from "axios"

export function AdaugaDepartamentModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    nume: '',
    cod: '',
    descriere: '',
    telefon: '',
    email: '',
    responsabilId: ''
  })
  
  const queryClient = useQueryClient()

  // Query pentru încărcarea utilizatorilor
  const {
    data: utilizatori = [],
    isLoading: utilizatoriLoading,
    error: utilizatoriError
  } = useQuery({
    queryKey: ['utilizatori'],
    queryFn: async () => {
      const response = await axios.get('/api/utilizatori')
      if (!response.data.success) {
        throw new Error('Nu s-au putut încărca utilizatorii')
      }
      return response.data.data
    },
    enabled: isOpen // Încarcă doar când modalul este deschis
  })

  // Mutation pentru crearea departamentului
  const createDepartamentMutation = useMutation({
    mutationFn: async (departamentData) => {
      const response = await axios.post('/api/departamente', departamentData)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la crearea departamentului')
      }
      return response.data.data
    },    onSuccess: (data) => {
      // Invalidează cache-ul pentru departamente
      queryClient.invalidateQueries({ queryKey: ['departamente'] })
      
      crudNotifications.created("Departamentul", data.nume)
      
      // Resetează formularul și închide modalul
      resetForm()
      setIsOpen(false)
    },
    onError: (error) => {
      console.error('Eroare la crearea departamentului:', error)
      notifyError(error.message || 'A apărut o eroare la crearea departamentului')
    }
  })
  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }
    const resetForm = () => {    setFormData({
      nume: '',
      cod: '',
      descriere: '',
      telefon: '',
      email: '',
      responsabilId: ''
    })
  }

  // Generează cod automat pe baza numelui
  const generateCod = (nume) => {
    if (!nume) return ''
    return nume
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Elimină caractere speciale
      .replace(/\s+/g, '_') // Înlocuiește spațiile cu underscore
      .substring(0, 20) // Limitează la 20 caractere
  }

  // Auto-generează codul când se schimbă numele
  useEffect(() => {
    if (formData.nume && !formData.cod) {
      setFormData(prev => ({
        ...prev,
        cod: generateCod(prev.nume)
      }))
    }
  }, [formData.nume])
  const validateForm = () => {
    if (!formData.nume.trim()) {
      validationNotifications.required('Numele departamentului')
      return false
    }
    if (formData.nume.trim().length < 2) {
      validationNotifications.minLength('Numele departamentului', 2)
      return false
    }
    if (!formData.cod.trim()) {
      validationNotifications.required('Codul departamentului')
      return false
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationNotifications.invalidFormat('Email', 'exemplu@domeniu.ro')
      return false
    }
    if (formData.telefon && !/^[\d\s\-\+\(\)\.]+$/.test(formData.telefon)) {
      validationNotifications.invalidFormat('Telefon', '0721.555.123')
      return false
    }
    return true
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Pregătește datele pentru trimitere
    const submitData = {
      ...formData,
      nume: formData.nume.trim(),
      cod: formData.cod.trim(),
      descriere: formData.descriere.trim() || null,
      responsabilId: formData.responsabilId === 'none' ? null : formData.responsabilId || null,
      telefon: formData.telefon.trim() || null,
      email: formData.email.trim() || null
    }    // Executează mutation-ul cu loading toast automat
    const loadingToast = crudNotifications.loading('creează', 'departamentul')
    
    try {
      await createDepartamentMutation.mutateAsync(submitData)
      dismissNotification(loadingToast)
    } catch (error) {
      dismissNotification(loadingToast)
      // Eroarea este deja gestionată în onError din mutation
    }
  }

  const handleOpenChange = (open) => {
    if (!open) {
      resetForm()
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adaugă Departament
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Adaugă Departament Nou
            </DialogTitle>            <DialogDescription>
              Completează informațiile pentru noul departament. Câmpurile marcate cu * sunt obligatorii.
              Responsabilul departamentului poate fi adăugat ulterior prin funcția de editare.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Nume Departament */}
            <div className="grid gap-2">
              <Label htmlFor="nume" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Nume Departament *
              </Label>
              <Input
                id="nume"
                placeholder="ex. Resurse Umane"
                value={formData.nume}
                onChange={handleInputChange}                required
                disabled={createDepartamentMutation.isPending}
                maxLength={100}
              />
            </div>

            {/* Cod Departament */}
            <div className="grid gap-2">
              <Label htmlFor="cod" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Cod Departament *
              </Label>
              <Input
                id="cod"
                placeholder="ex. RESURSE_UMANE"
                value={formData.cod}
                onChange={handleInputChange}                required
                disabled={createDepartamentMutation.isPending}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Codul se generează automat pe baza numelui, dar poate fi modificat
              </p>
            </div>            {/* Responsabil */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Responsabil Departament
              </Label>              <Select 
                value={formData.responsabilId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, responsabilId: value }))}
                disabled={createDepartamentMutation.isPending || utilizatoriLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    utilizatoriLoading 
                      ? "Se încarcă utilizatorii..." 
                      : "Selectează responsabilul departamentului"
                  } />
                </SelectTrigger>                <SelectContent>
                  <SelectItem value="none">Fără responsabil</SelectItem>
                  {utilizatori.map((utilizator) => (
                    <SelectItem key={utilizator.id} value={utilizator.id}>
                      {utilizator.nume} {utilizator.prenume} - {utilizator.functie || 'Fără funcție'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {utilizatoriError && (
                <p className="text-xs text-red-600">
                  Eroare la încărcarea utilizatorilor: {utilizatoriError.message}
                </p>
              )}
            </div>

            {/* Telefon */}
            <div className="grid gap-2">
              <Label htmlFor="telefon" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </Label>
              <Input
                id="telefon"
                type="tel"
                placeholder="ex. 0721.555.123"                value={formData.telefon}
                onChange={handleInputChange}
                disabled={createDepartamentMutation.isPending}
                maxLength={20}
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ex. resurse.umane@primaria.ro"                value={formData.email}
                onChange={handleInputChange}
                disabled={createDepartamentMutation.isPending}
                maxLength={100}
              />
            </div>

            {/* Descriere */}
            <div className="grid gap-2">
              <Label htmlFor="descriere">Descriere</Label>
              <Textarea
                id="descriere"
                placeholder="Descrierea activităților departamentului..."                value={formData.descriere}
                onChange={handleInputChange}
                disabled={createDepartamentMutation.isPending}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={createDepartamentMutation.isPending}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={createDepartamentMutation.isPending}>
              {createDepartamentMutation.isPending ? 'Se creează...' : 'Creează Departament'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}          