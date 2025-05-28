/**
 * Componentă pentru afișarea și gestionarea registrelor unui departament
 * @fileoverview Lista registrelor cu funcționalități CRUD
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  FileText, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Eye
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import axios from "axios"

export function ListaRegistre({ departmentId }) {
  const router = useRouter()
  const [registre, setRegistre] = useState([])
  const [departament, setDepartament] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Încarcă registrele la montarea componentei
  useEffect(() => {
    if (departmentId) {
      incarcaRegistre()
      incarcaDepartament()
    }
  }, [departmentId])

  const incarcaRegistre = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`/api/registre?departmentId=${departmentId}`)
      
      if (response.data.success) {
        setRegistre(response.data.data)
      }
    } catch (error) {
      console.error('Eroare la încărcarea registrelor:', error)
      setError('Nu s-au putut încărca registrele')
    } finally {
      setIsLoading(false)
    }
  }

  const incarcaDepartament = async () => {
    try {
      const response = await axios.get(`/api/departamente/${departmentId}`)
      
      if (response.data.success) {
        setDepartament(response.data.data)
      }
    } catch (error) {
      console.error('Eroare la încărcarea departamentului:', error)
    }
  }

  const handleVizualizeazaRegistru = (registruId) => {
    router.push(`/dashboard/e-registratura/${departmentId}/${registruId}`)
  }

  const handleStergeRegistru = async (id, nume) => {
    if (!confirm(`Ești sigur că vrei să ștergi registrul "${nume}"?`)) {
      return
    }

    try {
      const response = await axios.delete(`/api/registre/${id}`)
      
      if (response.data.success) {
        setRegistre(prev => prev.filter(r => r.id !== id))
      }
    } catch (error) {
      console.error('Eroare la ștergerea registrului:', error)
      alert(error.response?.data?.error || 'Nu s-a putut șterge registrul')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Se încarcă registrele...</p>
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
            <Button onClick={incarcaRegistre} className="mt-4">
              Încearcă din nou
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header cu informații departament */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Registre - {departament?.nume || 'Departament'}
          </h2>
          <p className="text-muted-foreground">
            Gestionează registrele departamentului
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adaugă Registru
        </Button>
      </div>

      {/* Lista registrelor */}
      {registre.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Niciun registru</h3>
              <p className="text-muted-foreground mb-4">
                Nu există registre create pentru acest departament. Adaugă primul registru pentru a începe.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Registru
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {registre.map((registru) => (
            <Card key={registru.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{registru.nume}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleVizualizeazaRegistru(registru.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Vizualizează
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editează
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleStergeRegistru(registru.id, registru.nume)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {registru.descriere && (
                  <CardDescription className="mt-2">
                    {registru.descriere}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Statistici */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {registru._count?.inregistrari || 0} înregistrări
                    </span>
                    <Badge variant="outline">
                      {registru.status === 'ACTIV' ? 'Activ' : 'Inactiv'}
                    </Badge>
                  </div>

                  {/* Data creării */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Creat: {new Date(registru.createdAt).toLocaleDateString('ro-RO')}
                  </div>

                  {/* Butoane acțiuni */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleVizualizeazaRegistru(registru.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Vizualizează
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
