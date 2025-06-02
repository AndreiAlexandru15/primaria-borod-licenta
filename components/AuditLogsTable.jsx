import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Search, Filter, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useAuditLogs, AUDIT_ACTIONS, ENTITY_TYPES } from "@/hooks/use-audit-logs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ro } from "date-fns/locale"

export default function AuditLogsTable() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    action: "",
    userId: "",
    entityType: "",
    search: "",
    startDate: "",
    endDate: ""
  })

  // Folosește hook-ul real pentru audit logs
  const { data, isLoading, error } = useAuditLogs({
    ...filters,
    page,
    limit: 10
  })
  const auditLogs = data?.logs || []
  const pagination = data?.pagination || {}

  // Funcție pentru afișarea user-friendly a acțiunilor
  const getActionDisplayName = (action) => {
    const actionMap = {
      // Autentificare
      'LOGIN_SUCCESS': 'Autentificare reușită',
      'LOGIN_FAILED': 'Autentificare eșuată', 
      'LOGOUT': 'Deconectare',
      
      // Departamente
      'CREATE_DEPARTMENT': 'Creare departament',
      'UPDATE_DEPARTMENT': 'Actualizare departament',
      'DELETE_DEPARTMENT': 'Ștergere departament',
      
      // Registre
      'CREATE_REGISTRU': 'Creare registru',
      'UPDATE_REGISTRU': 'Actualizare registru',
      'DELETE_REGISTRU': 'Ștergere registru',
      
      // Înregistrări
      'CREATE_INREGISTRARE': 'Creare înregistrare',
      'UPDATE_INREGISTRARE': 'Actualizare înregistrare',
      'DELETE_INREGISTRARE': 'Ștergere înregistrare',
      'FINALIZE_INREGISTRARE': 'Finalizare înregistrare',
      'CANCEL_INREGISTRARE': 'Anulare înregistrare',
      
      // Fișiere
      'UPLOAD_FILE': 'Încărcare fișier',
      'DOWNLOAD_FILE': 'Descărcare fișier',
      'DELETE_FILE': 'Ștergere fișier',
      'UPDATE_FILE': 'Actualizare fișier',
      'ASSOCIATE_FILE': 'Asociere fișier',
      
      // Utilizatori
      'CREATE_USER': 'Creare utilizator',
      'UPDATE_USER': 'Actualizare utilizator',
      'DELETE_USER': 'Ștergere utilizator',
      'ACTIVATE_USER': 'Activare utilizator',
      'DEACTIVATE_USER': 'Dezactivare utilizator',
      
      // Roluri și permisiuni
      'CREATE_ROL': 'Creare rol',
      'UPDATE_ROL': 'Actualizare rol',
      'DELETE_ROL': 'Ștergere rol',
      'ASSIGN_ROL': 'Atribuire rol',
      'REVOKE_ROL': 'Revocare rol',
      'CREATE_PERMISIUNE': 'Creare permisiune',
      'UPDATE_PERMISIUNE': 'Actualizare permisiune',
      'DELETE_PERMISIUNE': 'Ștergere permisiune',
      
      // Categorii documente
      'CREATE_CATEGORIE_DOCUMENT': 'Creare categorie document',
      'UPDATE_CATEGORIE_DOCUMENT': 'Actualizare categorie document',
      'DELETE_CATEGORIE_DOCUMENT': 'Ștergere categorie document',
      
      // Sistem
      'SYSTEM_BACKUP': 'Backup sistem',
      'SYSTEM_RESTORE': 'Restaurare sistem',
      'SYSTEM_MAINTENANCE': 'Mentenanță sistem',
      'DATA_EXPORT': 'Export date',
      'DATA_IMPORT': 'Import date'
    }
    
    return actionMap[action] || action
  }

  const getActionBadgeVariant = (actiune) => {
    if (actiune?.includes('CREATE')) return 'default'
    if (actiune?.includes('UPDATE')) return 'secondary' 
    if (actiune?.includes('DELETE')) return 'destructive'
    if (actiune?.includes('VIEW') || actiune?.includes('LOGIN')) return 'outline'
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

  const getEntityDisplayName = (log) => {
    if (log.fisierId) return `FISIER (${log.fisierId})`
    if (log.inregistrareId) return `INREGISTRARE (${log.inregistrareId})`
    return 'SISTEM'
  }
  const handleViewDetails = (log) => {
    // TODO: Implementează modal pentru detalii complete
    console.log('View details for:', log)
  }

  const handleDateSelect = (date, type) => {
    setFilters(prev => ({
      ...prev,
      [type]: date ? date.toISOString().split('T')[0] : ""
    }))
  }

  const clearFilters = () => {
    setFilters({
      action: "",
      userId: "",
      entityType: "",
      search: "",
      startDate: "",
      endDate: ""
    })
    setPage(1)
  }
  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        Eroare la încărcarea jurnalului de audit: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Căutare</label>
          <Input
            placeholder="Caută în jurnal..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>        {/* Action Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Acțiune</label>
          <Select
            value={filters.action || "all"}
            onValueChange={(value) => setFilters(prev => ({ ...prev, action: value === "all" ? "" : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toate acțiunile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate acțiunile</SelectItem>
              {Object.values(AUDIT_ACTIONS).map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>        {/* Entity Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tip entitate</label>
          <Select
            value={filters.entityType || "all"}
            onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value === "all" ? "" : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toate tipurile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile</SelectItem>
              {Object.values(ENTITY_TYPES).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="w-full"
        >
          <Filter className="h-4 w-4 mr-2" />
          Resetează filtrele
        </Button>
      </div>

      {/* Date Range Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="space-y-2">
          <label className="text-sm font-medium">Data început</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(new Date(filters.startDate), "PPP", { locale: ro })
                ) : (
                  "Selectează data"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.startDate ? new Date(filters.startDate) : undefined}
                onSelect={(date) => handleDateSelect(date, 'startDate')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Data sfârșit</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(new Date(filters.endDate), "PPP", { locale: ro })
                ) : (
                  "Selectează data"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.endDate ? new Date(filters.endDate) : undefined}
                onSelect={(date) => handleDateSelect(date, 'endDate')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        {isLoading ? (
          "Se încarcă..."
        ) : (
          `Afișez ${auditLogs.length} din ${pagination.total || 0} înregistrări`
        )}
      </div>      {/* Table */}
      <div className="border rounded-md">        <Table>
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
            ) : auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Nu sunt înregistrări în jurnal
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
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
                      {getActionDisplayName(log.actiune)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{getEntityDisplayName(log)}</div>
                      {log.detalii && (
                        <div className="text-xs text-muted-foreground">
                          {typeof log.detalii === 'string' ? log.detalii : JSON.stringify(log.detalii)}
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
            Afișez {((page - 1) * (pagination.limit || 10)) + 1}-{Math.min(page * (pagination.limit || 10), pagination.total || 0)} din {pagination.total || 0} înregistrări
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm">
              Pagina {page} din {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.min(pagination.totalPages || 1, prev + 1))}
              disabled={page === pagination.totalPages || isLoading}
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