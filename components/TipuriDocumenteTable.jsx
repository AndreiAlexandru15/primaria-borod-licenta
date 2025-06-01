import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Loader2, FileText } from "lucide-react"

export default function TipuriDocumenteTable({ 
  tipuriDocumente, 
  isLoading, 
  error, 
  onEdit, 
  onDelete, 
  isDeleting 
}) {
  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        Eroare la încărcarea tipurilor de documente: {error}
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nume Tip Document</TableHead>
          <TableHead>Cod</TableHead>
          <TableHead>Registru</TableHead>
          <TableHead>Categorie</TableHead>
          <TableHead>Descriere</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ordine</TableHead>
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
        ) : !tipuriDocumente || tipuriDocumente.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              Nu există tipuri de documente create.
            </TableCell>
          </TableRow>
        ) : (
          tipuriDocumente.map((tipDocument) => (
            <TableRow key={tipDocument.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {tipDocument.nume}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {tipDocument.cod}
                </Badge>
              </TableCell>
              <TableCell>
                {tipDocument.registru ? (
                  <div className="text-sm">
                    <div className="font-medium">{tipDocument.registru.nume}</div>
                    <div className="text-muted-foreground">{tipDocument.registru.cod}</div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Fără registru</span>
                )}
              </TableCell>
              <TableCell>
                {tipDocument.categorie ? (
                  <div className="text-sm">
                    <div className="font-medium">{tipDocument.categorie.nume}</div>
                    <div className="text-muted-foreground text-xs">{tipDocument.categorie.cod}</div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Fără categorie</span>
                )}
              </TableCell>
              <TableCell className="max-w-xs">
                {tipDocument.descriere ? (
                  <span className="text-sm text-muted-foreground">
                    {tipDocument.descriere.length > 50 
                      ? `${tipDocument.descriere.substring(0, 50)}...` 
                      : tipDocument.descriere
                    }
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Fără descriere</span>
                )}
              </TableCell>
              <TableCell>
                {getStatusBadge(tipDocument.activ)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  {tipDocument.ordineSortare || 0}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(tipDocument)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(tipDocument.id)}
                    disabled={isDeleting}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
