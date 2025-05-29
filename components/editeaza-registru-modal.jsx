/**
 * Modal pentru editarea unui registru
 * @fileoverview Formular de editare registru cu validare
 */

"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
import { Switch } from "@/components/ui/switch"
import { Loader2, Edit } from "lucide-react"
import { 
  crudNotifications,
  validationNotifications,
  notifyError 
} from "@/lib/notifications"

export function EditeazaRegistruModal({ registru, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nume: '',
    cod: '',
    descriere: '',
    tipRegistru: '',
    activ: true
  })
  const [errors, setErrors] = useState({})

  const queryClient = useQueryClient()

  // Populează formularul când se deschide modalul
  useEffect(() => {
    if (isOpen && registru) {
      setFormData({
        nume: registru.nume || '',
        cod: registru.cod || '',
        descriere: registru.descriere || '',
        tipRegistru: registru.tipRegistru || '',
        activ: registru.activ !== false
      })
      setErrors({})
    }
  }, [isOpen, registru])

  // Mutation pentru actualizarea registrului
  const updateRegistruMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.put(`/api/registru/${registru.id}`, data)
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la actualizarea registrului')
      }
      
      return response.data
    },
    onSuccess: (data) => {
      // Invalidează query-urile pentru registre
      queryClient.invalidateQueries({ queryKey: ['registre', registru.departamentId] })
        // Resetează formularul și închide modalul
      setFormData({
        nume: '',
        cod: '',
        descriere: '',
        tipRegistru: '',
        activ: true
      })
      setErrors({})
      onClose()
      
      // Afișează notificare de succes
      crudNotifications.updated('Registrul', data.data.nume)
      
      // Callback pentru componenta părinte
      if (onSuccess) {
        onSuccess(data.data)
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.message
      
      // Verifică dacă este o eroare de validare
      if (errorMessage.includes('obligatoriu') || errorMessage.includes('min.')) {
        validationNotifications.required(errorMessage)
      } else if (errorMessage.includes('există deja')) {
        validationNotifications.duplicate('registru', 'cod')
      } else {
        notifyError(errorMessage)
      }
    }
  })

  // Funcție pentru generarea automată a codului registrului
  const generateRegistruCode = (nume, tipRegistru) => {
    if (!nume.trim() || !tipRegistru) return ''
    
    // Extrage literele importante din nume
    const cuvinte = nume.trim().split(' ').filter(word => word.length > 0)
    let numePrefix = ''
    
    if (cuvinte.length === 1) {
      // Dacă e un singur cuvânt, ia primele 2-3 litere
      numePrefix = cuvinte[0].substring(0, 3).toUpperCase()
    } else if (cuvinte.length === 2) {
      // Dacă sunt 2 cuvinte, ia prima literă din primul și primele 2 din al doilea
      numePrefix = (cuvinte[0].charAt(0) + cuvinte[1].substring(0, 2)).toUpperCase()
    } else {
      // Dacă sunt 3+ cuvinte, ia prima literă din fiecare dintre primele 3
      numePrefix = cuvinte.slice(0, 3)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
    }
    
    // Asigură-te că prefix-ul are exact 2-3 caractere
    numePrefix = numePrefix.substring(0, 3).padEnd(2, 'X')
    
    // Mapează tipul de registru la codul corespunzător
    const tipuriCoduri = {
      'intrare': 'IN',
      'iesire': 'IE', 
      'intern': 'IT',
      'intrare_iesire': 'II'
    }
    
    const tipCod = tipuriCoduri[tipRegistru] || 'XX'
    
    return `${numePrefix}-${tipCod}`
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      
      // Dacă se modifică numele sau tipul registrului, generează automat codul
      if (field === 'nume' || field === 'tipRegistru') {
        newData.cod = generateRegistruCode(
          field === 'nume' ? value : prev.nume,
          field === 'tipRegistru' ? value : prev.tipRegistru
        )
      }
      
      return newData
    })
    
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
      newErrors.nume = 'Numele registrului este obligatoriu'
    } else if (formData.nume.trim().length < 2) {
      newErrors.nume = 'Numele trebuie să aibă cel puțin 2 caractere'
    }
    
    if (!formData.tipRegistru) {
      newErrors.tipRegistru = 'Tipul registrului este obligatoriu'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      validationNotifications.invalidForm()
      return
    }
    
    // Trimite datele procesate
    const dataToSend = {
      nume: formData.nume.trim(),
      cod: formData.cod.trim(),
      descriere: formData.descriere.trim() || null,
      tipRegistru: formData.tipRegistru,
      activ: formData.activ
    }
    
    updateRegistruMutation.mutate(dataToSend)
  }
  const handleOpenChange = (open) => {
    if (!open) {
      onClose()
      setFormData({
        nume: '',
        cod: '',
        descriere: '',
        tipRegistru: '',
        activ: true
      })
      setErrors({})
    }
  }

  // Opțiuni pentru tipul de registru
  const tipuriRegistru = [
    { value: 'intrare', label: 'Intrare' },
    { value: 'iesire', label: 'Ieșire' },
    { value: 'intern', label: 'Intern' },
    { value: 'intrare_iesire', label: 'Intrare/Ieșire' }
  ]
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editează Registru
          </DialogTitle>
          <DialogDescription>
            Modifică informațiile registrului. Codul se va actualiza automat.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nume">
              Nume registru <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-nume"
              placeholder="ex. Corespondență cu cetățenii"
              value={formData.nume}
              onChange={(e) => handleInputChange('nume', e.target.value)}
              className={errors.nume ? 'border-red-500' : ''}
            />
            {errors.nume && (
              <p className="text-sm text-red-500">{errors.nume}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tipRegistru">
              Tip registru <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.tipRegistru}
              onValueChange={(value) => handleInputChange('tipRegistru', value)}
            >
              <SelectTrigger className={errors.tipRegistru ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selectează tipul registrului" />
              </SelectTrigger>
              <SelectContent>
                {tipuriRegistru.map((tip) => (
                  <SelectItem key={tip.value} value={tip.value}>
                    {tip.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipRegistru && (
              <p className="text-sm text-red-500">{errors.tipRegistru}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cod">Cod registru (generat automat)</Label>
            <Input
              id="edit-cod"
              value={formData.cod}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Codul se generează automat pe baza numelui și tipului registrului
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-descriere">Descriere (opțional)</Label>
            <Textarea
              id="edit-descriere"
              placeholder="Descrierea registrului..."
              value={formData.descriere}
              onChange={(e) => handleInputChange('descriere', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-activ"
              checked={formData.activ}
              onCheckedChange={(checked) => handleInputChange('activ', checked)}
            />
            <Label htmlFor="edit-activ">Registru activ</Label>
          </div>          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={updateRegistruMutation.isPending}
            >
              Anulează
            </Button>
            <Button
              type="submit"
              disabled={updateRegistruMutation.isPending}
            >
              {updateRegistruMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se actualizează...
                </>
              ) : (
                'Actualizează registrul'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
