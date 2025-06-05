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
import { DataTable, SortableHeader } from "@/components/data-table"

import { AdaugaInregistrareModal } from "@/components/adauga-inregistrare-modal"
import { EditeazaInregistrareModal } from "@/components/editeaza-inregistrare-modal"
import { VizualizeazaInregistrareModal } from "@/components/vizualizeaza-inregistrare-modal"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import axios from "axios"

// Definirea coloanelor pentru DataTable
const getColumns = (formatDate, getStatusBadge, onView, onEdit, onDelete) => [
  {
    accessorKey: "numarInregistrare",
    header: ({ column }) => (
      <SortableHeader column={column}>
        Nr. Înregistrare
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-medium">
        <Hash className="h-4 w-4 text-blue-600" />
        {row.original.numarInregistrare}
      </div>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.original.numarInregistrare
      const b = rowB.original.numarInregistrare
      
      // Încearcă să convertești la număr
      const numA = parseInt(a)
      const numB = parseInt(b)
      
      // Dacă ambele sunt numere valide, compară numeric
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      
      // Altfel, compară ca string
      if (a < b) return -1
      if (a > b) return 1
      return 0
    },
  },
  {
    accessorKey: "dataInregistrare",
    header: ({ column }) => (
      <SortableHeader column={column}>
        Data Înregistrare
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(row.original.dataInregistrare)}
      </div>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      const a = new Date(rowA.original.dataInregistrare)
      const b = new Date(rowB.original.dataInregistrare)
      
      // Verifică dacă datele sunt valide
      if (isNaN(a.getTime()) && isNaN(b.getTime())) return 0
      if (isNaN(a.getTime())) return 1
      if (isNaN(b.getTime())) return -1
      
      return a.getTime() - b.getTime()
    },
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
    header: ({ column }) => (
      <SortableHeader column={column}>
        Data Document
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {row.original.dataFisier ? formatDate(row.original.dataFisier) : '-'}
      </div>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.original.dataFisier ? new Date(rowA.original.dataFisier) : null
      const b = rowB.original.dataFisier ? new Date(rowB.original.dataFisier) : null
      
      // Pune valorile null la sfârșitul listei
      if (!a && !b) return 0
      if (!a) return 1
      if (!b) return -1
      
      // Verifică dacă datele sunt valide
      if (isNaN(a.getTime()) && isNaN(b.getTime())) return 0
      if (isNaN(a.getTime())) return 1
      if (isNaN(b.getTime())) return -1
      
      return a.getTime() - b.getTime()
    },
  },
  // ...restul coloanelor rămân la fel...
  {
    accessorKey: "expeditor",
    header: "Expeditor",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[150px] truncate">
          {row.original.expeditor || '-'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "destinatarNume",
    header: "Destinatar",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[150px] truncate">
          {row.original.destinatarNume ? (
            `${row.original.destinatarNume}${row.original.destinatarFunctie ? ` (${row.original.destinatarFunctie})` : ''}`
          ) : '-'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "obiect",
    header: "Obiect",
    cell: ({ row }) => (
      <div className="max-w-[200px]">
        <p className="truncate font-medium">{row.original.obiect}</p>
        {row.original.observatii && (
          <p className="text-xs text-muted-foreground truncate">
            {row.original.observatii}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "confidentialitate",
    header: "Confidențialitate",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[100px] truncate">
          {row.original.confidentialitateFisierDenumire || row.original.confidentialitate?.denumire || '-'}
        </span>
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
    enableHiding: false,
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

export const ListaInregistrari = forwardRef(function ListaInregistrari({ departmentId, registerId, headerAction }, ref) {
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
  }
  
  // Mutation pentru ștergerea înregistrării
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
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Nr. Înregistrare</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Data Înregistrare</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Număr Document</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Data Document</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Expeditor</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Destinatar</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Obiect</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Confidențialitate</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-2 py-2"><Skeleton className="h-4 w-[100px]" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-4 w-[120px]" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-4 w-[100px]" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-4 w-[120px]" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-4 w-[120px]" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-4 w-[120px]" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-4 w-[200px]" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-4 w-[100px]" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-4 w-[80px]" /></td>
                      <td className="px-2 py-2 text-right"><Skeleton className="h-8 w-[90px] rounded-md" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      {/* Header responsive cu titlu și acțiuni */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
        
        {headerAction && (
          <div className="flex flex-wrap gap-2 justify-end mt-2 sm:mt-0">
            {headerAction}
          </div>
        )}
      </div>
      {/* DataTable pentru înregistrări */}
      <div className="w-full overflow-x-auto max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['inregistrari', 'registru', registerId] })
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="min-w-[600px] md:min-w-0">
            <DataTable 
              data={tableData} 
              columns={columns}
              searchKey="obiect"
              searchPlaceholder="Caută în obiect..."
            />
          </div>
        )}
      </div>

      {/* Modaluri */}
      <VizualizeazaInregistrareModal
        isOpen={viewModalOpen}
        onOpenChange={setViewModalOpen}
        inregistrare={selectedInregistrare}
        departamentId={departmentId}
        registruId={registerId}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ['inregistrari', 'registru', registerId] })
        }}
        onDelete={(id) => deleteInregistrareMutation.mutate(id)}
      />

      <EditeazaInregistrareModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        inregistrare={selectedInregistrare}
        departamentId={departmentId}
        registruId={registerId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['inregistrari', 'registru', registerId] })
          setEditModalOpen(false)
          setSelectedInregistrare(null)
        }}
      />      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Șterge înregistrarea"
        description={`Ești sigur că vrei să ștergi înregistrarea #${selectedInregistrare?.numarInregistrare}? Această acțiune nu poate fi anulată.`}
        onConfirm={confirmDelete}
        isLoading={deleteInregistrareMutation.isPending}
      />
    </div>
  )
})