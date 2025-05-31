/**
 * Componentă pentru afișarea înregistrărilor dintr-un registru
 * @fileoverview Lista înregistrărilor cu DataTable pentru registratură
 */

"use client"

import { useState, useMemo, forwardRef, useImperativeHandle } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileText, 
  Calendar,
  User,
  Hash,
  AlertTriangle,
  Building,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table"
import { AdaugaInregistrareModal } from "@/components/adauga-inregistrare-modal"
import { EditeazaInregistrareModal } from "@/components/editeaza-inregistrare-modal"
import { VizualizeazaInregistrareModal } from "@/components/vizualizeaza-inregistrare-modal"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import axios from "axios"

// Definirea coloanelor pentru DataTable
const getColumns = (formatDate, getStatusBadge, onView, onEdit, onDelete) => [
  {
    accessorKey: "numarInregistrare",
    header: "Nr. Înregistrare",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-medium">
        <Hash className="h-4 w-4 text-blue-600" />
        {row.original.numarInregistrare}
      </div>
    ),
  },
  {
    accessorKey: "dataInregistrare",
    header: "Data Înregistrare",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(row.original.dataInregistrare)}
      </div>
    ),
  },
  {
    accessorKey: "numarDocument",
    header: "Număr Document",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        {row.original.numarDocument || '-'}
      </div>
    ),
  },
  {
    accessorKey: "dataFisier",
    header: "Data Document",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {row.original.dataFisier ? formatDate(row.original.dataFisier) : '-'}
      </div>
    ),
  },
  {
    accessorKey: "expeditor",
    header: "Expeditor",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.original.expeditor || '-'}
      </div>
    ),
  },
  {
    accessorKey: "destinatarNume",
    header: "Destinatar",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.original.destinatarNume ? (
          <span>{row.original.destinatarNume}{row.original.destinatarFunctie ? ` (${row.original.destinatarFunctie})` : ''}</span>
        ) : (
          <span>-</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "obiect",
    header: "Obiect",
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <p className="truncate font-medium">{row.original.obiect}</p>
        {row.original.observatii && (
          <p className="text-xs text-muted-foreground truncate">
            {row.original.observatii}
          </p>
        )}
      </div>
    ),
  },  {
    accessorKey: "confidentialitate",
    header: "Confidențialitate",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        {row.original.confidentialitateFisierDenumire || row.original.confidentialitate?.denumire || '-'}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original),
  },
  {
    id: "actions",
    header: "Acțiuni",
    cell: ({ row }) => {
      const inregistrare = row.original
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Deschide meniu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(inregistrare)}>
              <Eye className="mr-2 h-4 w-4" />
              Vizualizează
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(inregistrare)}>
              <Edit className="mr-2 h-4 w-4" />
              Editează
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(inregistrare)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Șterge
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export const ListaInregistrari = forwardRef(function ListaInregistrari({ departmentId, registerId }, ref) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // State pentru modaluri
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedInregistrare, setSelectedInregistrare] = useState(null)
  
  // Query pentru înregistrări din registru
  const { 
    data: inregistrariData, 
    isLoading: isLoadingInregistrari, 
    error: errorInregistrari 
  } = useQuery({
    queryKey: ['inregistrari', 'registru', registerId],
    queryFn: async () => {
      const response = await axios.get(`/api/inregistrari?registruId=${registerId}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea înregistrărilor')
      }
      return response.data.data
    },
    enabled: !!registerId,
  })

  // Query pentru registru
  const { 
    data: registru, 
    isLoading: isLoadingRegistru 
  } = useQuery({
    queryKey: ['registru', registerId],
    queryFn: async () => {
      const response = await axios.get(`/api/registru/${registerId}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea registrului')
      }
      return response.data.data
    },
    enabled: !!registerId,
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
  const getStatusBadge = (inregistrare) => {
    // Determină statusul bazat pe proprietățile înregistrării
    if (inregistrare.urgent && inregistrare.confidential) {
      return <Badge variant="destructive">Urgent & Confidențial</Badge>
    }
    if (inregistrare.urgent) {
      return <Badge variant="destructive">Urgent</Badge>
    }
    if (inregistrare.confidential) {
      return <Badge variant="secondary">Confidențial</Badge>
    }
    return <Badge variant="outline">{inregistrare.status || 'Activa'}</Badge>
  }
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Funcții pentru acțiuni
  const handleView = (inregistrare) => {
    setSelectedInregistrare(inregistrare)
    setViewModalOpen(true)
  }

  const handleEdit = (inregistrare) => {
    setSelectedInregistrare(inregistrare)
    setEditModalOpen(true)
  }

  const handleDelete = (inregistrare) => {
    setSelectedInregistrare(inregistrare)
    setDeleteModalOpen(true)
  }  // Mutation pentru ștergerea înregistrării
  const deleteInregistrareMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/api/inregistrari/${id}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la ștergerea înregistrării')
      }
      return response.data
    },
    onSuccess: () => {
      // Invalidate all queries for this register's inregistrari (robust pattern)
      queryClient.invalidateQueries({ queryKey: ['inregistrari', 'registru', registerId], exact: false })
      setDeleteModalOpen(false)
      setSelectedInregistrare(null)
    },
    onError: (error) => {
      console.error('Eroare la ștergerea înregistrării:', error)
    }
  })

  const confirmDelete = () => {
    if (selectedInregistrare) {
      deleteInregistrareMutation.mutate(selectedInregistrare.id)
    }
  }

  const isLoading = isLoadingInregistrari || isLoadingRegistru || isLoadingDepartament
  const inregistrari = inregistrariData?.inregistrari || []
  
  // Stare pentru formatul de export selectat
  const [exportFormat, setExportFormat] = useState("excel")

  // Funcție pentru export cu format selectabil
  const handleExport = async (formatOverride) => {
    const formatToUse = formatOverride || "excel";
    try {
      const response = await axios.get(`/api/inregistrari/export?registruId=${registerId}&format=${formatToUse}`,
        { responseType: 'blob' })
      let mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      let ext = 'xlsx'
      if (formatToUse === 'csv') {
        mimeType = 'text/csv'
        ext = 'csv'
      } else if (formatToUse === 'pdf') {
        mimeType = 'application/pdf'
        ext = 'pdf'
      }
      const blob = new Blob([response.data], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const fileName = `inregistrari_${registerId}_${dateStr}.${ext}`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Eroare la export:', error)
      // Poți adăuga aici o notificare de eroare
    }
  }
  // Expune funcția de export către componenta părinte
  useImperativeHandle(ref, () => ({ handleExport }))
  
  // Prepare data for DataTable
  const tableData = useMemo(() => {
    return inregistrari
  }, [inregistrari])

  // Folosește getColumns cu acțiuni
  const columns = useMemo(
    () => getColumns(formatDate, getStatusBadge, handleView, handleEdit, handleDelete),
    [formatDate, getStatusBadge]
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-[400px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (errorInregistrari) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
            <p>{errorInregistrari.message}</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['inregistrari', 'registru', registerId] })} 
              className="mt-4"
            >
              Încearcă din nou
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 mt-6">
     
      {/* DataTable pentru înregistrări */}
      {tableData.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nicio înregistrare</h3>
              <p className="text-muted-foreground mb-4">
                Nu există înregistrări în acest registru.
              </p>
              <AdaugaInregistrareModal 
                departamentId={departmentId}
                registruId={registerId}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă Prima Înregistrare
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>      ) : (
        <div>
          <DataTable data={tableData} columns={columns} />
        </div>
      )}

      {/* Modaluri */}
      <VizualizeazaInregistrareModal
        isOpen={viewModalOpen}
        onOpenChange={setViewModalOpen}
        inregistrare={selectedInregistrare}
      />

      <EditeazaInregistrareModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        inregistrare={selectedInregistrare}
        departamentId={departmentId}
        registruId={registerId}        onSuccess={() => {
          // Invalidate exact query key used by this component
          queryClient.invalidateQueries({ queryKey: ['inregistrari', 'registru', registerId] })
          setEditModalOpen(false)
          setSelectedInregistrare(null)
        }}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Șterge înregistrarea"
        description={`Ești sigur că vrei să ștergi înregistrarea #${selectedInregistrare?.numarInregistrare}? Această acțiune nu poate fi anulată.`}
        onConfirm={confirmDelete}
        isLoading={deleteInregistrareMutation.isPending}
      />
    </div>
  )
})

