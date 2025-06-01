import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

export default function RolesTable({ roles, isLoading, error }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nume Rol</TableHead>
          <TableHead>Descriere</TableHead>
          <TableHead>Nivel Acces</TableHead>
          <TableHead>Sistem</TableHead>
          <TableHead>Utilizatori</TableHead>
          <TableHead>Permisiuni</TableHead>
          <TableHead>Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={7}>Se încarcă...</TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={7} className="text-red-500">{error}</TableCell>
          </TableRow>
        ) : roles.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7}>Nu există roluri.</TableCell>
          </TableRow>
        ) : (
          roles.map(rol => (
            <TableRow key={rol.id}>
              <TableCell>{rol.nume}</TableCell>
              <TableCell>{rol.descriere}</TableCell>
              <TableCell>{rol.nivelAcces}</TableCell>
              <TableCell>{rol.sistem ? "Da" : "Nu"}</TableCell>
              <TableCell>{rol.utilizatoriCount}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {rol.permisiuni.map(p => (
                    <Badge key={p.id} variant="outline">{p.nume}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
