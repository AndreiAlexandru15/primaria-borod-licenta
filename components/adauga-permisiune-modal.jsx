import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus } from "lucide-react"

const MODULES = [
  { value: "Users", label: "Utilizatori" },
  { value: "Roles", label: "Roluri" },
  { value: "Documents", label: "Documente" },
  { value: "Registers", label: "Registre" },
  { value: "Departments", label: "Departamente" },
  { value: "Archives", label: "Arhive" },
  { value: "Reports", label: "Rapoarte" },
  { value: "Settings", label: "Setări" },
  { value: "Audit", label: "Audit" }
]

const ACTIONS = [
  { value: "create", label: "Creare" },
  { value: "read", label: "Citire" },
  { value: "update", label: "Actualizare" },
  { value: "delete", label: "Ștergere" },
  { value: "export", label: "Export" },
  { value: "import", label: "Import" },
  { value: "manage", label: "Gestionare" },
  { value: "approve", label: "Aprobare" },
  { value: "archive", label: "Arhivare" }
]

export default function AddPermissionDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    nume: "",
    descriere: "",
    modul: "",
    actiune: ""
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (value, name) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const resetForm = () => {
    setForm({
      nume: "",
      descriere: "",
      modul: "",
      actiune: ""
    })
  }

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Adaugă Permisiune
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adaugă Permisiune Nouă</DialogTitle>
          <DialogDescription>Completează detaliile pentru permisiunea nouă</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nume" className="text-right">Nume</Label>
            <Input 
              id="nume" 
              name="nume" 
              className="col-span-3" 
              value={form.nume} 
              onChange={handleChange} 
              placeholder="ex: users.create, documents.read"
              required 
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modul" className="text-right">Modul</Label>
            <Select onValueChange={(value) => handleSelectChange(value, 'modul')} value={form.modul}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selectează modulul" />
              </SelectTrigger>
              <SelectContent>
                {MODULES.map((module) => (
                  <SelectItem key={module.value} value={module.value}>
                    {module.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="actiune" className="text-right">Acțiune</Label>
            <Select onValueChange={(value) => handleSelectChange(value, 'actiune')} value={form.actiune}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selectează acțiunea" />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="descriere" className="text-right">Descriere</Label>
            <Textarea 
              id="descriere" 
              name="descriere" 
              className="col-span-3" 
              value={form.descriere} 
              onChange={handleChange}
              placeholder="Descrierea permisiunii..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvează
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
