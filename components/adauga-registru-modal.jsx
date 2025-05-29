/**
 * Modal pentru adăugarea unui registru nou
 * @fileoverview Componentă modal pentru crearea registrelor cu toate câmpurile necesare
 */

"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Switch } from "@/components/ui/switch"
import { Plus, BookOpen, Hash, FileText, Tag } from "lucide-react"
import { 
  crudNotifications,
  notifyError,
  validationNotifications 
} from "@/lib/notifications"
import axios from "axios"

export function AdaugaRegistruModal({ departmentId, trigger }) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    nume: '',
    cod: '',
    descriere: '',
    tipRegistru: '',
    activ: true
  })
  const [errors, setErrors] = useState({})

  const queryClient = useQueryClient()

  // Mutation pentru crearea registrului
  const createRegistruMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/api/registru', {
        ...data,
        departamentId: departmentId
      })
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la crearea registrului')
      }
      
      return response.data
    },
    onSuccess: (data) => {
      // Invalidează query-urile pentru registre
      queryClient.invalidateQueries({ queryKey: ['registre', departmentId] })
      
      // Resetează formularul și închide modalul
      setFormData({
        nume: '',
        cod: '',
        descriere: '',
        tipRegistru: '',
        activ: true
      })
      setErrors({})
      setIsOpen(false)
      
      // Afișează notificare de succes
      crudNotifications.created('Registrul', data.data.nume)
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
    }  })
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
    
    createRegistruMutation.mutate(dataToSend)
  }

  const handleOpenChange = (open) => {
    setIsOpen(open)
    if (!open) {
      // Resetează formularul când se închide modalul
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
    { value: 'intrare_iesire', label: 'Intrare și Ieșire' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Registru
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Adaugă Registru Nou
          </DialogTitle>
          <DialogDescription>
            Completează informațiile pentru a crea un registru nou în acest departament.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nume registru */}
          <div className="space-y-2">
            <Label htmlFor="nume" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Nume registru *
            </Label>
            <Input
              id="nume"
              placeholder="ex. Registru corespondență intrare"
              value={formData.nume}
              onChange={(e) => handleInputChange('nume', e.target.value)}
              className={errors.nume ? 'border-red-500' : ''}
            />
            {errors.nume && (
              <p className="text-sm text-red-500">{errors.nume}</p>
            )}
          </div>          {/* Cod registru */}
          <div className="space-y-2">
            <Label htmlFor="cod" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Cod registru *
            </Label>
            <Input
              id="cod"
              placeholder="Se generează automat"
              value={formData.cod}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Codul se generează automat din primele 2 litere ale numelui și tipul registrului (ex: CC-II pentru "Corespondență Cetățeni" de tip "Intrare și Ieșire")
            </p>
          </div>

          {/* Tip registru */}
          <div className="space-y-2">
            <Label htmlFor="tipRegistru" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tip registru *
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

          {/* Descriere */}
          <div className="space-y-2">
            <Label htmlFor="descriere" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descriere
            </Label>
            <Textarea
              id="descriere"
              placeholder="Descrierea registrului (opțional)"
              value={formData.descriere}
              onChange={(e) => handleInputChange('descriere', e.target.value)}
              rows={3}
            />
          </div>

          {/* Status activ */}
          <div className="flex items-center space-x-2">
            <Switch
              id="activ"
              checked={formData.activ}
              onCheckedChange={(checked) => handleInputChange('activ', checked)}
            />
            <Label htmlFor="activ">Registru activ</Label>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={createRegistruMutation.isPending}
          >
            Anulează
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={createRegistruMutation.isPending}
          >
            {createRegistruMutation.isPending ? 'Se creează...' : 'Creează Registru'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
