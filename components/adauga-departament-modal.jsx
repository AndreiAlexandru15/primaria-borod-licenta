/**
 * Modal pentru adăugarea unui departament nou
 * @fileoverview Componentă modal pentru crearea departamentelor
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
import { Plus, Building2 } from "lucide-react"
import axios from "axios"

export function AdaugaDepartamentModal({ onDepartamentAdaugat }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
    const [formData, setFormData] = useState({
    nume: '',
    descriere: ''
  })

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }
  const resetForm = () => {
    setFormData({
      nume: '',
      descriere: ''
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/departamente', formData)
      
      if (response.data.success) {
        // Notifică componenta părinte că s-a adăugat un departament
        if (onDepartamentAdaugat) {
          onDepartamentAdaugat(response.data.data)
        }
        
        // Resetează formularul și închide modalul
        resetForm()
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Eroare la crearea departamentului:', error)
      if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else {
        setError('A apărut o eroare la crearea departamentului')
      }
    } finally {
      setIsLoading(false)
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
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Adaugă Departament Nou
            </DialogTitle>
            <DialogDescription>
              Completează informațiile pentru noul departament. Câmpurile marcate cu * sunt obligatorii.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

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
                disabled={isLoading}
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
                disabled={isLoading}
                rows={3}
                maxLength={500}
              />            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Se creează...' : 'Creează Departament'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
