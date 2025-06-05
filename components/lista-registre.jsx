/**
 * Componentă pentru afișarea și gestionarea registrelor unui departament
 * @fileoverview Lista registrelor cu funcționalități CRUD în format tabular
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { ConfirmDeleteModal, useConfirmDelete, deleteConfigs } from "@/components/confirm-delete-modal"
import { AdaugaRegistruModal } from "@/components/adauga-registru-modal"
import { EditeazaRegistruModal } from "@/components/editeaza-registru-modal"
import { crudNotifications, notifyError } from "@/lib/notifications"
import axios from "axios"

// Skeleton pentru tabel
function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-2 py-1 text-xs">Nume</TableHead>
          <TableHead className="px-2 py-1 text-xs">Cod</TableHead>
          <TableHead className="px-2 py-1 text-xs hidden md:table-cell">Descriere</TableHead>
          <TableHead className="px-2 py-1 text-xs">Înregistrări</TableHead>
          <TableHead className="px-2 py-1 text-xs hidden sm:table-cell">Status</TableHead>
          <TableHead className="px-2 py-1 text-xs hidden md:table-cell">An</TableHead>
          <TableHead className="px-2 py-1 text-xs hidden md:table-cell">Data creării</TableHead>
          <TableHead className="px-2 py-1 text-xs text-right">Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell className="px-2 py-1 text-xs"><Skeleton className="h-4 w-[80px]" /></TableCell>
            <TableCell className="px-2 py-1 text-xs"><Skeleton className="h-4 w-[40px]" /></TableCell>
            <TableCell className="px-2 py-1 text-xs hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell className="px-2 py-1 text-xs"><Skeleton className="h-4 w-[30px]" /></TableCell>
            <TableCell className="px-2 py-1 text-xs hidden sm:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
            <TableCell className="px-2 py-1 text-xs hidden md:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
            <TableCell className="px-2 py-1 text-xs hidden md:table-cell"><Skeleton className="h-4 w-[60px]" /></TableCell>
            <TableCell className="px-2 py-1 text-xs text-right"><Skeleton className="h-8 w-[60px] rounded-md" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function ListaRegistre({ departmentId }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isOpen, deleteConfig, openDeleteModal, closeDeleteModal } = useConfirmDelete()
  const [editingRegistru, setEditingRegistru] = useState(null)
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Query pentru registre
  const {
    data: registreDataRaw,
    isLoading: isLoadingRegistre,
    error: errorRegistre
  } = useQuery({
    queryKey: ['registre', departmentId, selectedYear],
    queryFn: async () => {
      const response = await axios.get(`/api/registru?departmentId=${departmentId}&an=${selectedYear}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea registrelor')
      }
      return response.data
    },
    enabled: !!departmentId,
  })

  // Query pentru departament
  const {
    data: departament,
    isLoading: isLoadingDepartament
  } = useQuery({
    queryKey: ['departament', departmentId],
    queryFn: async () => {
      const response = await axios.get(`/api/departamente/${departmentId}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea departamentului')
      }
      return response.data.data
    },
    enabled: !!departmentId,
  })

  // Extrage registre și ani disponibili
  const registre = registreDataRaw?.data || [];
  const aniDisponibili = registreDataRaw?.ani || [currentYear];

  // Mutation pentru ștergere
  const deleteRegistruMutation = useMutation({
    mutationFn: async ({ id, nume }) => {
      const response = await axios.delete(`/api/registru/${id}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Nu s-a putut șterge registrul')
      }
      return { ...response.data, numeRegistru: nume }
    },    
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registre', departmentId] })
      crudNotifications.deleted('Registrul', data.numeRegistru)
    },    
    onError: (error) => {
      notifyError(error.message)
    }
  })
  const handleVizualizeazaRegistru = (registruId) => {
    router.push(`/dashboard/e-registratura/${departmentId}/${registruId}`)
  }
    const handleStergeRegistru = (id, nume) => {
    openDeleteModal({
      ...deleteConfigs.registru,
      itemName: nume,
      onConfirm: () => deleteRegistruMutation.mutate({ id, nume })
    })
  }

  const isLoading = isLoadingRegistre || isLoadingDepartament
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-[300px] mb-2" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <TableSkeleton />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (errorRegistre) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{errorRegistre.message}</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['registre', departmentId] })} 
              className="mt-4"
            >
              Încearcă din nou
            </Button>
          </div>        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 mt-8">

     
      {registre.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Niciun registru</h3>              <p className="text-muted-foreground mb-4">
                Nu există registre create pentru acest departament. Adaugă primul registru pentru a începe.
              </p>
              <AdaugaRegistruModal departmentId={departmentId} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Registre ({registre.length})
            </CardTitle>
            <CardDescription>
              Lista tuturor registrelor din departament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2 py-1 text-xs">Nume</TableHead>
                  <TableHead className="px-2 py-1 text-xs">Cod</TableHead>
                  <TableHead className="px-2 py-1 text-xs hidden md:table-cell">Descriere</TableHead>
                  <TableHead className="px-2 py-1 text-xs">Înregistrări</TableHead>
                  <TableHead className="px-2 py-1 text-xs hidden sm:table-cell">Status</TableHead>
                  <TableHead className="px-2 py-1 text-xs hidden md:table-cell">An</TableHead>
                  <TableHead className="px-2 py-1 text-xs hidden md:table-cell">Data creării</TableHead>
                  <TableHead className="px-2 py-1 text-xs text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registre.map((registru) => (
                  <TableRow key={registru.id}>
                    <TableCell className="px-2 py-1 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        {registru.nume}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs">
                      <Badge variant="outline">
                        {registru.cod || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs max-w-[120px] truncate hidden md:table-cell">
                      {registru.descriere || '-'}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {registru._count?.inregistrari || 0}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs hidden sm:table-cell">
                      <Badge variant={registru.activ ? "default" : "secondary"}>
                        {registru.activ ? 'Activ' : 'Inactiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs hidden md:table-cell">
                      {registru.an}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs hidden md:table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(registru.createdAt).toLocaleDateString('ro-RO')}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleVizualizeazaRegistru(registru.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Vizualizează
                        </Button>
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
                            </DropdownMenuItem>                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                setEditingRegistru(registru)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editează
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleStergeRegistru(registru.id, registru.nume)}
                              disabled={deleteRegistruMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deleteRegistruMutation.isPending ? 'Se șterge...' : 'Șterge'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>        </Card>      )}

      {/* Modal Editare */}
      {editingRegistru && (
        <EditeazaRegistruModal 
          registru={editingRegistru}
          isOpen={!!editingRegistru}
          onClose={() => setEditingRegistru(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['registre', departmentId] })
            setEditingRegistru(null)
          }}
        />
      )}

      {/* Modaluri */}
      <ConfirmDeleteModal
        isOpen={isOpen}
        onClose={closeDeleteModal}
        config={deleteConfig}
        isLoading={deleteRegistruMutation.isPending}
      />
    </div>
  )
}
