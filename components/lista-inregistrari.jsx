/**
 * Componentă pentru afișarea înregistrărilor dintr-un registru
 * @fileoverview Lista înregistrărilor cu DataTable pentru registratură
 */

"use client"

import { useState, useMemo } from "react"
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
  Plus
} from "lucide-react"
import { DataTable } from "@/components/data-table"
import { AdaugaInregistrareModal } from "@/components/adauga-inregistrare-modal"
import axios from "axios"

// Definirea coloanelor pentru DataTable
const getColumns = (formatDate, getStatusBadge) => [
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
    ),  },
  {
    accessorKey: "expeditor",
    header: "Expeditor",
    cell: ({ row }) => (      <div className="flex items-center gap-1">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.original.expeditor || '-'}
      </div>
    ),
  },
  {
    accessorKey: "destinatar",
    header: "Destinatar",
    cell: ({ row }) => (      <div className="flex items-center gap-1">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.original.destinatar || '-'}
      </div>
    ),
  },  {
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
  },
  {
    accessorKey: "documente",
    header: "Documente",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <FileText className="h-4 w-4 text-muted-foreground" />
        {row.original.documente?.length || 0}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original),
  },
]

export function ListaInregistrari({ departmentId, registerId }) {
  const router = useRouter()
  const queryClient = useQueryClient()
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
  const isLoading = isLoadingInregistrari || isLoadingRegistru || isLoadingDepartament
  const inregistrari = inregistrariData?.inregistrari || []
  
  // Prepare data for DataTable
  const tableData = useMemo(() => {
    return inregistrari
  }, [inregistrari])

  const columns = useMemo(() => getColumns(formatDate, getStatusBadge), [])

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
    <div className="space-y-6 mt-6">      {/* Header cu informații */}
          {/* DataTable pentru înregistrări */}
      {tableData.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nicio înregistrare</h3>
              <p className="text-muted-foreground mb-4">
                Nu există înregistrări în acest registru.
              </p>              <AdaugaInregistrareModal 
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
        </Card>
      ) : (
       <div>
                    <DataTable data={tableData} columns={getColumns(formatDate, getStatusBadge)} />

        </div>
      )}

    </div>
  )
}

