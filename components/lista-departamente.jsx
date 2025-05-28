/**
 * Componentă pentru afișarea și gestionarea departamentelor
 * @fileoverview Lista departamentelor cu funcționalități CRUD
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  FileText, 
  MoreHorizontal,
  Edit,
  Trash2,
  User,
  FolderOpen
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdaugaDepartamentModal } from "./adauga-departament-modal"
import axios from "axios"

export function ListaDepartamente() {
  const [departamente, setDepartamente] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Încarcă departamentele la montarea componentei
  useEffect(() => {
    incarcaDepartamente()
  }, [])

  const incarcaDepartamente = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/api/departamente')
      
      if (response.data.success) {
        setDepartamente(response.data.data)
      }
    } catch (error) {
      console.error('Eroare la încărcarea departamentelor:', error)
      setError('Nu s-au putut încărca departamentele')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDepartamentAdaugat = (departamentNou) => {
    setDepartamente(prev => [...prev, departamentNou])
  }

  const handleStergeDepartament = async (id, nume) => {
    if (!confirm(`Ești sigur că vrei să ștergi departamentul "${nume}"?`)) {
      return
    }

    try {
      const response = await axios.delete(`/api/departamente/${id}`)
      
      if (response.data.success) {
        setDepartamente(prev => prev.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Eroare la ștergerea departamentului:', error)
      alert(error.response?.data?.error || 'Nu s-a putut șterge departamentul')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Se încarcă departamentele...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={incarcaDepartamente} className="mt-4">
              Încearcă din nou
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header cu butonul de adăugare */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departamente</h2>
          <p className="text-muted-foreground">
            Gestionează departamentele din primărie
          </p>
        </div>
        <AdaugaDepartamentModal onDepartamentAdaugat={handleDepartamentAdaugat} />
      </div>

      {/* Lista departamentelor */}
      {departamente.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Niciun departament</h3>
              <p className="text-muted-foreground mb-4">
                Nu există departamente create. Adaugă primul departament pentru a începe.
              </p>
              <AdaugaDepartamentModal onDepartamentAdaugat={handleDepartamentAdaugat} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departamente.map((departament) => (
            <Card key={departament.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{departament.nume}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editează
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleStergeDepartament(departament.id, departament.nume)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {departament.descriere && (
                  <CardDescription className="line-clamp-2">
                    {departament.descriere}
                  </CardDescription>
                )}
              </CardHeader>
                <CardContent className="space-y-3">
                {/* Responsabil */}
                {departament.responsabil && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{departament.responsabil.nume} {departament.responsabil.prenume}</span>
                  </div>
                )}

                {/* Cod departament */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>Cod: {departament.cod}</span>
                </div>

                {/* Statistici */}
                <div className="flex gap-2 pt-2 border-t">
                  <Badge variant="secondary" className="text-xs">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {departament._count?.registre || 0} registre
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {departament._count?.documente || 0} documente
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
