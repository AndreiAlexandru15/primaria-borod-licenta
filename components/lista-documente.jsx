"use client";
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  FileText,
  Calendar,
  Hash,
  FolderOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  EllipsisVertical,
  Plus,
  Upload,
} from "lucide-react";

// Import componentele pentru vizualizare și upload
import { VizualizeazaDocumentModal } from "./vizualizeaza-document-modal";
import { FileUploadModal } from "./file-upload-modal";
import { AdaugaInregistrareModal } from "./adauga-inregistrare-modal";
import { ConfirmDeleteModal } from "./confirm-delete-modal";
import { notifySuccess } from "@/lib/notifications";

export function ListaDocumente({ externalUploadModalState }) {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Use external state if provided, otherwise use internal state
  const [internalShowUploadModal, setInternalShowUploadModal] = useState(false);
  const showUploadModal = externalUploadModalState?.showUploadModal ?? internalShowUploadModal;
  const setShowUploadModal = externalUploadModalState?.setShowUploadModal ?? setInternalShowUploadModal;

  // State pentru modalul de înregistrare
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedDocumentForRegistration, setSelectedDocumentForRegistration] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["fisiere"],
    queryFn: async () => {
      const response = await axios.get("/api/fisiere");
      if (!response.data.success)
        throw new Error(response.data.error || "Eroare la încărcarea fișierelor");
      return response.data.data;
    },
  });

  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("neinregistrate");

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      const matchesText = item.numeOriginal.toLowerCase().includes(filter.toLowerCase());
      const isInregistrat = Boolean(item.inregistrareId);
      const matchesStatus =
        statusFilter === "toate" ||
        (statusFilter === "inregistrate" && isInregistrat) ||
        (statusFilter === "neinregistrate" && !isInregistrat);

      return matchesText && matchesStatus;
    });
  }, [data, filter, statusFilter]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const sortedData = useMemo(() => {
    if (!filteredData) return [];
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const getValue = (obj, key) => {
        if (!key) return undefined;
        return key.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
      };

      const aValue = getValue(a, sortConfig.key);
      const bValue = getValue(b, sortConfig.key);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string") {
        if (sortConfig.direction === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }

      if (aValue instanceof Date || !isNaN(Date.parse(aValue))) {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        if (sortConfig.direction === "asc") {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      }

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3" />;
    }
    return sortConfig.direction === "asc" ? 
      <ArrowUp className="h-3 w-3" /> : 
      <ArrowDown className="h-3 w-3" />;
  };

  const handleView = (doc) => {
    setSelectedDocument(doc);
    setShowViewModal(true);
  };

  const handleEdit = (doc) => {
    // TODO: Implementează editarea documentului
    console.log("Editare document:", doc);
  };

  const [deleteModal, setDeleteModal] = useState({ open: false, docId: null });

  const handleDelete = (docId) => {
    setDeleteModal({ open: true, docId });
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`/api/fisiere/${deleteModal.docId}`);
      if (response.data.success) {
        refetch();
        notifySuccess('Documentul a fost șters cu succes!');
      }
    } catch (error) {
      console.error('Eroare la ștergerea documentului:', error);
    } finally {
      setDeleteModal({ open: false, docId: null });
    }
  };  const handleRegister = (doc) => {
    console.log("Înregistrare document:", doc);
    setSelectedDocumentForRegistration(doc);
    setShowRegistrationModal(true);
  };

  const handleRegistrationModalClose = (open) => {
    setShowRegistrationModal(open);
    if (!open) {
      setSelectedDocumentForRegistration(null);
      // Refresh the data when modal closes (in case document was registered)
      refetch();
      notifySuccess("Documentul a fost înregistrat cu succes!");
    }
  };

  const handleUploadComplete = () => {
    refetch(); // Refresh lista după upload
  };

  // PAGINATION STATE
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calculate paginated data
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  // Reset page if filters change and page is out of range
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [sortedData, page, totalPages]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        
        {/* Table skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 mt-6">
          <FileText className="h-5 w-5" />
          <h2 className="text-2xl font-semibold tracking-tight">Documente</h2>
        </div>
        <Badge variant="secondary">
          {filteredData.length} {filteredData.length === 1 ? 'document' : 'documente'}
        </Badge>
      </div>

      {/* Filtere */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Căutare după nume document..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Filtrează după status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toate">Toate statusurile</SelectItem>
            <SelectItem value="inregistrate">Înregistrate</SelectItem>
            <SelectItem value="neinregistrate">Neînregistrate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                onClick={() => handleSort("numeOriginal")}
                className="cursor-pointer select-none hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Nume document
                  {getSortIcon("numeOriginal")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Categorie
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("inregistrare.numarInregistrare")}
                className="cursor-pointer select-none hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Nr. înregistrare
                  {getSortIcon("inregistrare.numarInregistrare")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("dataFisier")}
                className="cursor-pointer select-none hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dată fișier
                  {getSortIcon("dataFisier")}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">
                <div className="flex items-center justify-center">
                  <EllipsisVertical className="h-4 w-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((doc, index) => (
                <TableRow 
                  key={doc.id} 
                  className={`hover:bg-muted/50 transition-colors ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-sm">{doc.numeOriginal}</div>
                        {doc.extensie && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {doc.extensie.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.categorie?.nume ? (
                      <Badge variant="outline">{doc.categorie.nume}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {doc.inregistrare?.numarInregistrare ? (
                      <Badge variant="secondary" className="font-mono">
                        {doc.inregistrare.numarInregistrare}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {doc.dataFisier ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(doc.dataFisier).toLocaleDateString('ro-RO')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {doc.inregistrareId ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        ✓ Înregistrat
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                        ⏳ Neînregistrat
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleView(doc)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Vizualizează
                          </DropdownMenuItem>
                          
                          {/* Opțiunea de înregistrare doar pentru documente neînregistrate */}
                          {!doc.inregistrareId && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRegister(doc)}
                                className="text-blue-600 focus:text-blue-600"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Înregistrează
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuSeparator />                          <DropdownMenuItem 
                            onClick={() => handleDelete(doc.id)}
                            disabled={!!doc.inregistrareId}
                            className={`${doc.inregistrareId ? 'opacity-50 cursor-not-allowed' : 'text-red-600 focus:text-red-600'}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {doc.inregistrareId ? 'Nu se poate șterge' : 'Șterge'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Nu există documente</p>
                      <p className="text-xs text-muted-foreground">
                        {filter ? 'Încercați să modificați criteriile de căutare' : 'Nu au fost găsite documente în sistem'}
                      </p>
                    </div>
                    {filter && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFilter("")}
                      >
                        Șterge filtrul
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION CONTROLS */}
      {sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Afișează</span>
            <Select value={String(pageSize)} onValueChange={val => { setPageSize(Number(val)); setPage(1); }}>
              <SelectTrigger className="w-[80px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">/ pagină</span>
          </div>
          {/* Pagination buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
              Prima
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Pagina {page} din {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Următoarea
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
              Ultima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de vizualizare document */}
      <VizualizeazaDocumentModal
        document={selectedDocument}
        isOpen={showViewModal}
        onOpenChange={setShowViewModal}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRegister={handleRegister}
        onRefresh={refetch}
      />      {/* Modal de upload fișiere */}
      <FileUploadModal
        isOpen={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={handleUploadComplete}
      />

      {/* Modal de înregistrare document */}
      <AdaugaInregistrareModal
        preExistingFile={selectedDocumentForRegistration}
        isOpen={showRegistrationModal}
        onOpenChange={handleRegistrationModalClose}
        departamentId={null} // TODO: Pass proper department ID when available
        registruId={null} // TODO: Pass proper registry ID when available
        allowDepartmentSelection={true} // Enable department/registry selection from documents page
        allowFileRemoval={false} // Disable file removal for pre-existing files
        trigger={null} // Nu afișa butonul default
      />

      {/* Modal de confirmare ștergere */}
      <ConfirmDeleteModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, docId: null })}
        onConfirm={confirmDelete}
        title="Confirmă ștergerea documentului"
        description="Ești sigur că vrei să ștergi acest document? Această acțiune nu poate fi anulată."
        isDangerous={true}
      />
    </div>
  );
}