import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function UsersTable({
  searchTerm,
  setSearchTerm,
  users,
  isLoading,
  error,
  handleDeleteUser,
  deleteUserMutation,
  handleEditUser,
  AddUserDialog
}) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută utilizatori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        {AddUserDialog}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nume</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Funcție</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Departament</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Se încarcă utilizatorii...
                </div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-red-500">
                Eroare la încărcarea utilizatorilor: {error.message}
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                {searchTerm ? 'Nu s-au găsit utilizatori care să corespundă căutării.' : 'Nu există utilizatori înregistrați.'}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.nume} {user.prenume}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.functie || '-'}</TableCell>
                <TableCell>{user.telefon || '-'}</TableCell>
                <TableCell>
                  {user.departamente && user.departamente.length > 0 ? (
                    <Badge variant="outline">
                      {user.departamente[0].departament?.nume}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="default">Active</Badge>
                </TableCell>
                <TableCell>                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      {deleteUserMutation.isPending ? (
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
    </>
  )
}