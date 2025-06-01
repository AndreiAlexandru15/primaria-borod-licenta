import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Loader2 } from "lucide-react"

export default function PermissionsTable({ 
  permissions, 
  isLoading, 
  error, 
  onEdit, 
  onDelete, 
  isDeleting 
}) {
  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        Eroare la încărcarea permisiunilor: {error}
      </div>
    )
  }

  const getModuleColor = (modul) => {
    const colors = {
      "Users": "bg-blue-100 text-blue-800",
      "Roles": "bg-green-100 text-green-800",
      "Documents": "bg-purple-100 text-purple-800",
      "Registers": "bg-orange-100 text-orange-800",
      "Departments": "bg-teal-100 text-teal-800",
      "Archives": "bg-gray-100 text-gray-800",
      "Reports": "bg-yellow-100 text-yellow-800",
      "Settings": "bg-pink-100 text-pink-800",
      "Audit": "bg-red-100 text-red-800"
    }
    return colors[modul] || "bg-gray-100 text-gray-800"
  }

  const getActionColor = (actiune) => {
    const colors = {
      "create": "bg-green-100 text-green-800",
      "read": "bg-blue-100 text-blue-800",
      "update": "bg-yellow-100 text-yellow-800",
      "delete": "bg-red-100 text-red-800",
      "export": "bg-purple-100 text-purple-800",
      "import": "bg-purple-100 text-purple-800",
      "manage": "bg-orange-100 text-orange-800",
      "approve": "bg-teal-100 text-teal-800",
      "archive": "bg-gray-100 text-gray-800"
    }
    return colors[actiune] || "bg-gray-100 text-gray-800"
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nume Permisiune</TableHead>
          <TableHead>Descriere</TableHead>
          <TableHead>Modul</TableHead>
          <TableHead>Acțiune</TableHead>
          <TableHead>Roluri</TableHead>
          <TableHead>Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="mt-2">Se încarcă...</p>
            </TableCell>
          </TableRow>
        ) : permissions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              Nu există permisiuni create.
            </TableCell>
          </TableRow>
        ) : (
          permissions.map((permission) => (
            <TableRow key={permission.id}>
              <TableCell className="font-medium">{permission.nume}</TableCell>
              <TableCell className="max-w-xs">
                {permission.descriere ? (
                  <span className="text-sm text-muted-foreground">
                    {permission.descriere.length > 50 
                      ? `${permission.descriere.substring(0, 50)}...` 
                      : permission.descriere
                    }
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Fără descriere</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getModuleColor(permission.modul)}>
                  {permission.modul}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getActionColor(permission.actiune)}>
                  {permission.actiune}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {permission.roluriCount} roluri
                  </span>
                  {permission.roluri && permission.roluri.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {permission.roluri.slice(0, 2).map((rol) => (
                        <Badge key={rol.id} variant="secondary" className="text-xs">
                          {rol.nume}
                        </Badge>
                      ))}
                      {permission.roluri.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{permission.roluri.length - 2} altele
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEdit && onEdit(permission)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete && onDelete(permission.id)}
                    disabled={isDeleting === permission.id || permission.roluriCount > 0}
                    title={permission.roluriCount > 0 ? "Nu se poate șterge - permisiunea este folosită de roluri" : "Șterge permisiunea"}
                  >
                    {isDeleting === permission.id ? (
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
