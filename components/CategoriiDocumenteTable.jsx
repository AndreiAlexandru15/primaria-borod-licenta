/**
 * Componentă pentru afișarea și gestionarea categoriilor de documente
 * @fileoverview Tabelă pentru categorii de documente cu funcționalități CRUD
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Loader2, FolderOpen, FileText } from "lucide-react"

export default function CategoriiDocumenteTable({ 
  categorii, 
  isLoading, 
  error, 
  onEdit, 
  onDelete, 
  isDeleting 
}) {
  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        Eroare la încărcarea categoriilor de documente: {error}
      </div>
    )
  }

  const getStatusBadge = (activ) => {
    return activ ? (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        Activ
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-100 text-red-800">
        Inactiv
      </Badge>
    )
  }

  const formatRetentionPeriod = (years) => {
    if (!years) return "Nedefinită"
    return `${years} ${years === 1 ? 'an' : 'ani'}`
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nume Categorie</TableHead>
          <TableHead>Cod</TableHead>
          <TableHead>Descriere</TableHead>
          <TableHead>Perioada Retenție</TableHead>
          <TableHead>Confidențialitate</TableHead>
          <TableHead>Documente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="mt-2">Se încarcă...</p>
            </TableCell>
          </TableRow>
        ) : !categorii || categorii.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              Nu există categorii de documente create.
            </TableCell>
          </TableRow>
        ) : (
          categorii.map((categorie) => (
            <TableRow key={categorie.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  {categorie.nume}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {categorie.cod}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                {categorie.descriere ? (
                  <span className="text-sm text-muted-foreground">
                    {categorie.descriere.length > 50 
                      ? `${categorie.descriere.substring(0, 50)}...` 
                      : categorie.descriere
                    }
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Fără descriere</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {formatRetentionPeriod(categorie.perioadaRetentie)}
                </Badge>
              </TableCell>
              <TableCell>
                {categorie.confidentialitateDefault ? (
                  <div className="text-sm">
                    <div className="font-medium">{categorie.confidentialitateDefault.denumire}</div>
                    <div className="text-muted-foreground text-xs">{categorie.confidentialitateDefault.cod}</div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Nedefinită</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{categorie._count?.fisiere || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(categorie.active)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(categorie)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(categorie.id)}
                    disabled={isDeleting || (categorie._count?.fisiere > 0)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    title={categorie._count?.fisiere > 0 ? "Nu se poate șterge categoria cu documente asociate" : "Șterge categoria"}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
