"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"
import axios from "axios"

export default function AddUserDialog({
  open,
  onOpenChange,
  newUserData,
  setNewUserData,
  handleCreateUser,
  createUserMutation,
  departments,
  isLoadingDepartments
}) {
  const [roluriData, setRoluriData] = useState([])
  const [isLoadingRoluri, setIsLoadingRoluri] = useState(true)

  // Încarcă rolurile la mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoluri(true)
        const response = await axios.get('/api/roluri')
        if (response.data.success) {
          setRoluriData(response.data.data || [])
        }
      } catch (error) {
        console.error('Eroare la încărcarea rolurilor:', error)
        setRoluriData([])
      } finally {
        setIsLoadingRoluri(false)
      }
    }
    
    fetchRoles()
  }, [])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adaugă Utilizator
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adaugă Utilizator Nou</DialogTitle>
          <DialogDescription>Completează detaliile pentru utilizatorul nou</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nume" className="text-right">Nume *</Label>
            <Input 
              id="nume" 
              className="col-span-3" 
              value={newUserData.nume}
              onChange={(e) => setNewUserData({...newUserData, nume: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="prenume" className="text-right">Prenume *</Label>
            <Input 
              id="prenume" 
              className="col-span-3" 
              value={newUserData.prenume}
              onChange={(e) => setNewUserData({...newUserData, prenume: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email *</Label>
            <Input 
              id="email" 
              type="email" 
              className="col-span-3" 
              value={newUserData.email}
              onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
              required
            />
          </div>          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="functie" className="text-right">Funcție *</Label>
            <Select
              value={newUserData.functie || ""}
              onValueChange={(value) => setNewUserData({...newUserData, functie: value})}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selectează funcția..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingRoluri ? (
                  <SelectItem value="" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se încarcă rolurile...
                  </SelectItem>
                ) : roluriData.length === 0 ? (
                  <SelectItem value="" disabled>
                    Nu există roluri disponibile
                  </SelectItem>
                ) : (
                  roluriData.map((rol) => (
                    <SelectItem key={rol.id} value={rol.nume}>
                      <div className="truncate">
                        {rol.nume}
                        {rol.descriere && (
                          <span className="text-muted-foreground ml-2">
                            - {rol.descriere}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="telefon" className="text-right">Telefon *</Label>
            <Input 
              id="telefon" 
              className="col-span-3" 
              value={newUserData.telefon}
              onChange={(e) => setNewUserData({...newUserData, telefon: e.target.value})}
              required
            />
          </div>          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parola" className="text-right">Parolă *</Label>
            <Input 
              id="parola" 
              type="password"
              className="col-span-3" 
              value={newUserData.parola}
              onChange={(e) => setNewUserData({...newUserData, parola: e.target.value})}
              placeholder="Parola utilizatorului"
              required
            />
          </div><div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="departament" className="text-right">Departament *</Label>
            <Select 
              value={newUserData.departamentId || "none"} 
              onValueChange={(value) => setNewUserData({...newUserData, departamentId: value === "none" ? "" : value})}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selectează un departament" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Fără departament</SelectItem>
                {isLoadingDepartments ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Se încarcă...
                  </SelectItem>
                ) : (
                  departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      <div className="truncate">
                        {dept.nume} {dept.cod && `(${dept.cod})`}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Anulează
          </Button>
          <Button 
            onClick={handleCreateUser}
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvează
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}