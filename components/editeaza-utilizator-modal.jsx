/**
 * Modal pentru editarea unui utilizator existent
 * @fileoverview Componentă modal pentru editarea datelor utilizatorilor
 */

"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import axios from "axios"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit, User, Mail, Phone, Building, Key, Loader2 } from "lucide-react"
import { crudNotifications, notifyError } from "@/lib/notifications"
import { useUpdateUser } from "@/hooks/use-users"
import { useDepartments } from "@/hooks/use-departments"

export default function EditeazaUtilizatorModal({
  utilizator, 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    nume: '',
    prenume: '',
    email: '',
    functie: '',
    telefon: '',
    parola: '',
    departamentId: ''
  })
  const [errors, setErrors] = useState({})

  const queryClient = useQueryClient()
  // Hook pentru departamente
  const { data: departamenteData = [], isLoading: isLoadingDepartmente } = useDepartments()
  
  // State pentru roluri
  const [roluriData, setRoluriData] = useState([])
  const [isLoadingRoluri, setIsLoadingRoluri] = useState(true)
  
  // Încarcă rolurile la mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoluri(true)
        const response = await axios.get('/api/roluri')
        setRoluriData(response.data.data || [])
      } catch (error) {
        console.error('Eroare la încărcarea rolurilor:', error)
      } finally {
        setIsLoadingRoluri(false)
      }
    }
    
    fetchRoles()
  }, [])

  // Populează formularul când utilizatorul se schimbă
  useEffect(() => {
    if (isOpen && utilizator) {
      const departamentActiv = utilizator.departamente?.find(d => d.activ)
      setFormData({
        nume: utilizator.nume || '',
        prenume: utilizator.prenume || '',
        email: utilizator.email || '',
        functie: utilizator.functie || '',
        telefon: utilizator.telefon || '',
        parola: '', // Parolă goală pentru securitate
        departamentId: departamentActiv?.departament?.id || ''
      })
      setErrors({})
    }  }, [isOpen, utilizator])

  // Mutation pentru actualizarea utilizatorului
  const updateUtilizatorMutation = useUpdateUser()

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Șterge eroarea pentru câmpul modificat
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.nume.trim()) {
      newErrors.nume = 'Numele este obligatoriu'
    } else if (formData.nume.trim().length < 2) {
      newErrors.nume = 'Numele trebuie să aibă cel puțin 2 caractere'
    }
    
    if (!formData.prenume.trim()) {
      newErrors.prenume = 'Prenumele este obligatoriu'
    } else if (formData.prenume.trim().length < 2) {
      newErrors.prenume = 'Prenumele trebuie să aibă cel puțin 2 caractere'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email-ul este obligatoriu'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email-ul nu este valid'
    }
    
    if (formData.parola && formData.parola.length < 6) {
      newErrors.parola = 'Parola trebuie să aibă cel puțin 6 caractere'
    }
    
    if (formData.telefon && !/^[0-9+\-.\s()]+$/.test(formData.telefon)) {
      newErrors.telefon = 'Numărul de telefon nu este valid'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      notifyError('Te rugăm să corectezi erorile din formular')
      return
    }
    
    // Trimite datele procesate
    const dataToSend = {
      nume: formData.nume.trim(),
      prenume: formData.prenume.trim(),
      email: formData.email.trim(),
      functie: formData.functie.trim() || null,
      telefon: formData.telefon.trim() || null,
      departamentId: formData.departamentId || null
    }
    
    // Adaugă parola doar dacă a fost completată
    if (formData.parola && formData.parola.trim() !== '') {
      dataToSend.parola = formData.parola.trim()
    }
    
    updateUtilizatorMutation.mutate({
      id: utilizator.id,
      data: dataToSend
    }, {      onSuccess: (response) => {
        // Resetează formularul și închide modalul
        setFormData({
          nume: '',
          prenume: '',
          email: '',
          functie: '',
          telefon: '',
          parola: '',
          departamentId: ''
        })
        setErrors({})
        onClose()
        
        // Afișează notificare de succes
        const updatedUser = response.data
        crudNotifications.updated('Utilizatorul', `${updatedUser.nume} ${updatedUser.prenume}`)
        
        // Callback pentru componenta părinte
        if (onSuccess) {
          onSuccess(response)
        }
      },
      onError: (error) => {
        notifyError('Eroare la actualizarea utilizatorului: ' + error.message)
      }
    })
  }

  const handleOpenChange = (open) => {
    if (!open) {
      onClose()
      setFormData({
        nume: '',
        prenume: '',
        email: '',
        functie: '',
        telefon: '',
        parola: '',
        departamentId: ''
      })
      setErrors({})
    }
  }

  if (!utilizator) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editează Utilizator
          </DialogTitle>
          <DialogDescription>
            Modifică datele utilizatorului. Câmpurile marcate cu * sunt obligatorii.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nume și Prenume */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nume" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nume <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-nume"
                placeholder="Numele utilizatorului"
                value={formData.nume}
                onChange={(e) => handleInputChange('nume', e.target.value)}
                className={errors.nume ? 'border-red-500' : ''}
                disabled={updateUtilizatorMutation.isPending}
                maxLength={50}
              />
              {errors.nume && (
                <p className="text-sm text-red-500">{errors.nume}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-prenume">
                Prenume <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-prenume"
                placeholder="Prenumele utilizatorului"
                value={formData.prenume}
                onChange={(e) => handleInputChange('prenume', e.target.value)}
                className={errors.prenume ? 'border-red-500' : ''}
                disabled={updateUtilizatorMutation.isPending}
                maxLength={50}
              />
              {errors.prenume && (
                <p className="text-sm text-red-500">{errors.prenume}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="adresa@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
              disabled={updateUtilizatorMutation.isPending}
              maxLength={100}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>          {/* Funcție */}
          <div className="space-y-2">
            <Label htmlFor="edit-functie">Funcția în cadrul primăriei</Label>
            <Select
              value={formData.functie}
              onValueChange={(value) => handleInputChange('functie', value)}
              disabled={updateUtilizatorMutation.isPending || isLoadingRoluri}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectează funcția..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingRoluri ? (
                  <SelectItem value="" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se încarcă rolurile...
                  </SelectItem>
                ) : roluriData.length === 0 ? (
                  <SelectItem value="" disabled>
                    Nu există roluri disponibile
                  </SelectItem>
                ) : (
                  roluriData.map((rol) => (
                    <SelectItem key={rol.id} value={rol.nume}>
                      {rol.nume}
                      {rol.descriere && (
                        <span className="text-muted-foreground ml-2">
                          - {rol.descriere}
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Telefon */}
          <div className="space-y-2">
            <Label htmlFor="edit-telefon" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefon
            </Label>
            <Input
              id="edit-telefon"
              type="tel"
              placeholder="ex. 0721.555.123"
              value={formData.telefon}
              onChange={(e) => handleInputChange('telefon', e.target.value)}
              className={errors.telefon ? 'border-red-500' : ''}
              disabled={updateUtilizatorMutation.isPending}
              maxLength={20}
            />
            {errors.telefon && (
              <p className="text-sm text-red-500">{errors.telefon}</p>
            )}
          </div>

          {/* Departament */}
          <div className="space-y-2">
            <Label htmlFor="edit-departament" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Departament
            </Label>
            <Select
              value={formData.departamentId}
              onValueChange={(value) => handleInputChange('departamentId', value === 'none' ? '' : value)}
              disabled={updateUtilizatorMutation.isPending || isLoadingDepartmente}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isLoadingDepartmente 
                    ? "Se încarcă departamentele..." 
                    : "Selectează departamentul (opțional)"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Fără departament</SelectItem>
                {departamenteData.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.nume} {dept.cod && `(${dept.cod})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parolă nouă */}
          <div className="space-y-2">
            <Label htmlFor="edit-parola" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Parolă nouă (opțional)
            </Label>
            <Input
              id="edit-parola"
              type="password"
              placeholder="Lasă gol pentru a păstra parola actuală"
              value={formData.parola}
              onChange={(e) => handleInputChange('parola', e.target.value)}
              className={errors.parola ? 'border-red-500' : ''}
              disabled={updateUtilizatorMutation.isPending}
              autoComplete="new-password"
            />
            {errors.parola && (
              <p className="text-sm text-red-500">{errors.parola}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Completează doar dacă vrei să schimbi parola utilizatorului
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={updateUtilizatorMutation.isPending}
            >
              Anulează
            </Button>
            <Button
              type="submit"
              disabled={updateUtilizatorMutation.isPending}
            >
              {updateUtilizatorMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se actualizează...
                </>
              ) : (
                'Actualizează utilizatorul'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>  )
}
