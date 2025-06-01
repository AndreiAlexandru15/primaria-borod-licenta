import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function AuditLogsTable() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    actiune: "",
    utilizator: "",
    search: ""
  })

  // Mock data pentru now - va fi înlocuit cu hook-ul real
  const [data, setData] = useState({
    data: [
      {
        id: "1",
        utilizator: { nume: "Popescu", prenume: "Ion", email: "ion.popescu@primarie.ro" },
        actiune: "CREATE_USER",
        detalii: { resource: "Utilizator", resourceId: "user123" },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0...",
        createdAt: "2025-06-01T10:30:00.000Z"
      },
      {
        id: "2",
        utilizator: { nume: "Ionescu", prenume: "Maria", email: "maria.ionescu@primarie.ro" },
        actiune: "DELETE_DOCUMENT",
        detalii: { resource: "Document", resourceId: "doc123" },
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0...",
        createdAt: "2025-06-01T09:15:00.000Z"
      },
      {
        id: "3",
        utilizator: { nume: "Georgescu", prenume: "Alexandru", email: "alex.georgescu@primarie.ro" },
        actiune: "UPDATE_ROLE",
        detalii: { resource: "Rol", resourceId: "role456" },
        ipAddress: "192.168.1.102",
        userAgent: "Mozilla/5.0...",
        createdAt: "2025-05-31T16:45:00.000Z"
      }
    ],
    pagination: {
      total: 150,
      page: 1,
      limit: 10,
      totalPages: 15
    }
  })

  const isLoading = false
  const error = null

  const auditLogs = data?.data || []
  const pagination = data?.pagination || {}

  const getActionBadgeVariant = (actiune) => {
    if (actiune.includes('CREATE')) return 'default'
    if (actiune.includes('UPDATE')) return 'secondary' 
    if (actiune.includes('DELETE')) return 'destructive'
    if (actiune.includes('VIEW') || actiune.includes('READ')) return 'outline'
    return 'outline'
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getUserDisplayName = (utilizator) => {
    if (!utilizator) return 'Sistem'
    return `${utilizator.nume} ${utilizator.prenume}`
  }

  const getResourceFromDetails = (detalii) => {
    if (!detalii) return 'N/A'
    return detalii.resource || 'Necunoscut'
  }

  const handleViewDetails = (log) => {
    // TODO: Implementează modal pentru detalii complete
    console.log('View details for:', log)
  }

  const filteredLogs = auditLogs.filter(log => {
    if (filters.actiune && !log.actiune.toLowerCase().includes(filters.actiune.toLowerCase())) {
      return false
    }
    if (filters.utilizator && log.utilizator && 
        !getUserDisplayName(log.utilizator).toLowerCase().includes(filters.utilizator.toLowerCase())) {
      return false
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      return (
        log.actiune.toLowerCase().includes(searchTerm) ||
        getUserDisplayName(log.utilizator).toLowerCase().includes(searchTerm) ||
        getResourceFromDetails(log.detalii).toLowerCase().includes(searchTerm) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm))
      )
    }
    return true
  })

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        Eroare la încărcarea jurnalului de audit
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Caută în jurnal..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="max-w-sm"
          />
        </div>
        <Select
          value={filters.actiune}
          onValueChange={(value) => setFilters(prev => ({ ...prev, actiune: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrează acțiunea" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toate acțiunile</SelectItem>
            <SelectItem value="CREATE">CREATE</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="VIEW">VIEW</SelectItem>
            <SelectItem value="LOGIN">LOGIN</SelectItem>
            <SelectItem value="LOGOUT">LOGOUT</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Filtrează utilizator..."
          value={filters.utilizator}
          onChange={(e) => setFilters(prev => ({ ...prev, utilizator: e.target.value }))}
          className="w-[200px]"
        />
      </div>

      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Afișez {filteredLogs.length} din {auditLogs.length} înregistrări
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilizator</TableHead>
              <TableHead>Acțiune</TableHead>
              <TableHead>Resursă</TableHead>
              <TableHead>Data/Ora</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Nu sunt înregistrări în jurnal
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{getUserDisplayName(log.utilizator)}</div>
                      {log.utilizator?.email && (
                        <div className="text-xs text-muted-foreground">
                          {log.utilizator.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.actiune)}>
                      {log.actiune}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{getResourceFromDetails(log.detalii)}</div>
                      {log.detalii?.resourceId && (
                        <div className="text-xs text-muted-foreground">
                          ID: {log.detalii.resourceId}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatTimestamp(log.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {log.ipAddress || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Afișez {((page - 1) * 10) + 1}-{Math.min(page * 10, pagination.total)} din {pagination.total} înregistrări
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm">
              Pagina {page} din {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={page === pagination.totalPages}
            >
              Următorul
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}