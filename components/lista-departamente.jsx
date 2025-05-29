"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Building2, FileText, MoreHorizontal, Edit, Trash2, User, FolderOpen
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdaugaDepartamentModal } from "./adauga-departament-modal"
import { EditeazaDepartamentModal } from "./editeaza-departament-modal"
import { ConfirmDeleteModal, useConfirmDelete, deleteConfigs } from "./confirm-delete-modal"
import { 
  crudNotifications,
  notifyError 
} from "@/lib/notifications"

// Skeleton pentru card-ul de departament
function DepartamentCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ListaDepartamente() {
  const queryClient = useQueryClient()
  const { isOpen, deleteConfig, openDeleteModal, closeDeleteModal } = useConfirmDelete()

  const {
    data: departamente = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['departamente'],
    queryFn: async () => {
      const res = await axios.get('/api/departamente')
      if (!res.data.success) {
        throw new Error("Nu s-au putut încărca departamentele")
      }
      return res.data.data
    }
  })

  const stergeDepartamentMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`/api/departamente/${id}`)
      if (!res.data.success) {
        throw new Error(res.data.error || 'Eroare la ștergere')
      }
      return res.data
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['departamente'] })
      const departament = departamente.find(d => d.id === id)
      if (departament) {
        crudNotifications.deleted("Departamentul", departament.nume)
      }
    },
    onError: (error) => {
      notifyError(error.message || 'A apărut o eroare la ștergerea departamentului')
    }
  })

  const handleStergeDepartament = (id, nume) => {
    const departament = departamente.find(d => d.id === id)
    const numarDocumente = departament?._count?.documente || 0
    const numarRegistre = departament?._count?.registre || 0
    
    let warningMessage = deleteConfigs.departament.warningMessage
    if (numarDocumente > 0 || numarRegistre > 0) {
      warningMessage += ` Departamentul conține ${numarRegistre} registre și ${numarDocumente} documente.`
    }

    openDeleteModal({
      ...deleteConfigs.departament,
      itemName: nume,
      description: `Ești sigur că vrei să ștergi departamentul "${nume}"? Această acțiune nu poate fi anulată.`,
      warningMessage,
      onConfirm: () => stergeDepartamentMutation.mutateAsync(id)
    })
  }
  if (isLoading) {
    return (
      <div className="space-y-6 mt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <DepartamentCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error.message}</p>
            <Button onClick={refetch} className="mt-4">
              Încearcă din nou
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 mt-6">
      {departamente.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Niciun departament</h3>
              <p className="text-muted-foreground mb-4">
                Nu există departamente create. Adaugă primul departament pentru a începe.
              </p>
              <AdaugaDepartamentModal />
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
                    <DropdownMenuContent align="end">                      <EditeazaDepartamentModal 
                        departament={departament} 
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editează
                          </DropdownMenuItem>
                        }
                      />
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
                {departament.responsabil && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{departament.responsabil.nume} {departament.responsabil.prenume}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>Cod: {departament.cod}</span>
                </div>
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
          ))}        </div>
      )}
      
      <ConfirmDeleteModal
        isOpen={isOpen}
        onClose={closeDeleteModal}
        config={deleteConfig}
        isLoading={stergeDepartamentMutation.isPending}
      />
    </div>
  )
}
