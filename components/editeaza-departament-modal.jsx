/**
 * Modal pentru editarea unui departament existent
 * @fileoverview Componentă modal pentru editarea departamentelor cu restricții pe cod
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Building2, User, Phone, Mail, Hash, AlertTriangle } from "lucide-react"
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

export function EditeazaDepartamentModal({ departament, trigger }) {
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
    enabled: isOpen
  })

  // Query pentru detaliile departamentului (pentru a verifica dacă are documente)
  const {
    data: departamentDetalii,
    isLoading: departamentLoading
  } = useQuery({
    queryKey: ['departament', departament?.id],
    queryFn: async () => {
      const response = await axios.get(`/api/departamente/${departament.id}`)
      if (!response.data.success) {
        throw new Error('Nu s-au putut încărca detaliile departamentului')
      }
      return response.data.data
    },
    enabled: isOpen && !!departament?.id
  })

  // Populează formularul când se deschide modalul
  useEffect(() => {
    if (isOpen && departament) {
      setFormData({
        nume: departament.nume || '',
        cod: departament.cod || '',
        descriere: departament.descriere || '',
        telefon: departament.telefon || '',
        email: departament.email || '',
        responsabilId: departament.responsabilId || ''
      })
    }
  }, [isOpen, departament])

  // Mutation pentru actualizarea departamentului
  const updateDepartamentMutation = useMutation({
    mutationFn: async (departamentData) => {
      const response = await axios.put(`/api/departamente/${departament.id}`, departamentData)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la actualizarea departamentului')
      }
      return response.data.data
    },    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['departamente'] })
      queryClient.invalidateQueries({ queryKey: ['departament', departament.id] })
      
      crudNotifications.updated("Departamentul", data.nume)
      
      setIsOpen(false)
    },
    onError: (error) => {
      console.error('Eroare la actualizarea departamentului:', error)
      notifyError(error.message || 'A apărut o eroare la actualizarea departamentului')
    }
  })

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }
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
    }    // Executează mutation-ul
    const loadingToast = crudNotifications.loading('actualizează', 'departamentul')
    
    try {
      await updateDepartamentMutation.mutateAsync(submitData)
      dismissNotification(loadingToast)
    } catch (error) {
      dismissNotification(loadingToast)
    }
  }

  const handleOpenChange = (open) => {
    setIsOpen(open)
  }

  // Verifică dacă departamentul are documente înregistrate
  const areDocumente = departamentDetalii?._count?.documente > 0
  const codNuSePotModifica = areDocumente

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editează
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Editează Departament
            </DialogTitle>
            <DialogDescription>
              Modifică informațiile departamentului. Câmpurile marcate cu * sunt obligatorii.
            </DialogDescription>
          </DialogHeader>
          
          {codNuSePotModifica && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Codul departamentului nu poate fi modificat deoarece există {departamentDetalii?._count?.documente} 
                {departamentDetalii?._count?.documente === 1 ? ' document înregistrat' : ' documente înregistrate'} 
                în acest departament.
              </AlertDescription>
            </Alert>
          )}
          
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
                onChange={handleInputChange}
                required
                disabled={updateDepartamentMutation.isPending}
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
                onChange={handleInputChange}
                required
                disabled={updateDepartamentMutation.isPending || codNuSePotModifica}
                maxLength={20}
              />
              {codNuSePotModifica && (
                <p className="text-xs text-muted-foreground">
                  Codul nu poate fi modificat deoarece departamentul are documente înregistrate
                </p>
              )}
            </div>

            {/* Responsabil */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Responsabil Departament
              </Label>
              <Select 
                value={formData.responsabilId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, responsabilId: value }))}
                disabled={updateDepartamentMutation.isPending || utilizatoriLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    utilizatoriLoading 
                      ? "Se încarcă utilizatorii..." 
                      : "Selectează responsabilul departamentului"
                  } />
                </SelectTrigger>
                <SelectContent>
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
                placeholder="ex. 0721.555.123"
                value={formData.telefon}
                onChange={handleInputChange}
                disabled={updateDepartamentMutation.isPending}
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
                placeholder="ex. resurse.umane@primaria.ro"
                value={formData.email}
                onChange={handleInputChange}
                disabled={updateDepartamentMutation.isPending}
                maxLength={100}
              />
            </div>

            {/* Descriere */}
            <div className="grid gap-2">
              <Label htmlFor="descriere">Descriere</Label>
              <Textarea
                id="descriere"
                placeholder="Descrierea activităților departamentului..."
                value={formData.descriere}
                onChange={handleInputChange}
                disabled={updateDepartamentMutation.isPending}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={updateDepartamentMutation.isPending}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={updateDepartamentMutation.isPending}>
              {updateDepartamentMutation.isPending ? 'Se actualizează...' : 'Actualizează Departament'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
