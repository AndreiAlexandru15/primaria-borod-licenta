/**
 * Componentă pentru afișarea și gestionarea înregistrărilor dintr-un registru
 * @fileoverview Lista înregistrărilor cu funcționalități CRUD
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Calendar,
  User,
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import axios from "axios"

export function ListaInregistrari({ departmentId, registerId }) {
  const [inregistrari, setInregistrari] = useState([])
  const [registru, setRegistru] = useState(null)
  const [departament, setDepartament] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Încarcă înregistrările la montarea componentei
  useEffect(() => {
    if (departmentId && registerId) {
      incarcaInregistrari()
      incarcaRegistru()
      incarcaDepartament()
    }
  }, [departmentId, registerId])

  const incarcaInregistrari = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`/api/inregistrari?registerId=${registerId}`)
      
      if (response.data.success) {
        setInregistrari(response.data.data)
      }
    } catch (error) {
      console.error('Eroare la încărcarea înregistrărilor:', error)
      setError('Nu s-au putut încărca înregistrările')
    } finally {
      setIsLoading(false)
    }
  }

  const incarcaRegistru = async () => {
    try {
      const response = await axios.get(`/api/registre/${registerId}`)
      
      if (response.data.success) {
        setRegistru(response.data.data)
      }
    } catch (error) {
      console.error('Eroare la încărcarea registrului:', error)
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

  const handleStergeInregistrare = async (id, numar) => {
    if (!confirm(`Ești sigur că vrei să ștergi înregistrarea nr. ${numar}?`)) {
      return
    }

    try {
      const response = await axios.delete(`/api/inregistrari/${id}`)
      
      if (response.data.success) {
        setInregistrari(prev => prev.filter(i => i.id !== id))
      }
    } catch (error) {
      console.error('Eroare la ștergerea înregistrării:', error)
      alert(error.response?.data?.error || 'Nu s-a putut șterge înregistrarea')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'INREGISTRAT': { label: 'Înregistrat', variant: 'default' },
      'IN_LUCRU': { label: 'În lucru', variant: 'secondary' },
      'FINALIZAT': { label: 'Finalizat', variant: 'outline' },
      'ARHIVAT': { label: 'Arhivat', variant: 'destructive' }
    }
    
    const config = statusConfig[status] || statusConfig['INREGISTRAT']
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredInregistrari = inregistrari.filter(inregistrare =>
    inregistrare.numarInregistrare.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inregistrare.obiect?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inregistrare.expeditor?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Se încarcă înregistrările...</p>
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
            <Button onClick={incarcaInregistrari} className="mt-4">
              Încearcă din nou
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header cu informații */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {registru?.nume || 'Registru'} - {departament?.nume || 'Departament'}
          </h2>
          <p className="text-muted-foreground">
            Gestionează înregistrările din registru
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouă înregistrare
          </Button>
        </div>
      </div>

      {/* Căutare și filtrare */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Căutare după număr, obiect sau expeditor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtre
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista înregistrărilor */}
      {filteredInregistrari.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Niciun rezultat găsit' : 'Nicio înregistrare'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Încearcă să modifici termenii de căutare'
                  : 'Nu există înregistrări în acest registru. Adaugă prima înregistrare pentru a începe.'
                }
              </p>
              {!searchTerm && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouă înregistrare
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Număr</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Expeditor</TableHead>
                  <TableHead>Obiect</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInregistrari.map((inregistrare) => (
                  <TableRow key={inregistrare.id}>
                    <TableCell className="font-medium">
                      {inregistrare.numarInregistrare}
                    </TableCell>
                    <TableCell>
                      {new Date(inregistrare.dataInregistrare).toLocaleDateString('ro-RO')}
                    </TableCell>
                    <TableCell>{inregistrare.expeditor || '-'}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {inregistrare.obiect || '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(inregistrare.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Vizualizează
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editează
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleStergeInregistrare(inregistrare.id, inregistrare.numarInregistrare)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Șterge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Statistici */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total înregistrări</p>
                <p className="text-2xl font-bold">{inregistrari.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Astăzi</p>
                <p className="text-2xl font-bold">
                  {inregistrari.filter(i => 
                    new Date(i.dataInregistrare).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">În lucru</p>
                <p className="text-2xl font-bold">
                  {inregistrari.filter(i => i.status === 'IN_LUCRU').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Finalizate</p>
                <p className="text-2xl font-bold">
                  {inregistrari.filter(i => i.status === 'FINALIZAT').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
