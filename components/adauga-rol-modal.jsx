import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus } from "lucide-react"

export default function AddRoleDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    nume: "",
    descriere: "",
    nivelAcces: 1,
    sistem: false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Adaugă Rol
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adaugă Rol Nou</DialogTitle>
          <DialogDescription>Completează detaliile pentru rolul nou</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nume" className="text-right">Nume</Label>
            <Input id="nume" name="nume" className="col-span-3" value={form.nume} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descriere" className="text-right">Descriere</Label>
            <Input id="descriere" name="descriere" className="col-span-3" value={form.descriere} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nivelAcces" className="text-right">Nivel Acces</Label>
            <Input id="nivelAcces" name="nivelAcces" type="number" min={1} max={10} className="col-span-3" value={form.nivelAcces} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sistem" className="text-right">Rol de sistem?</Label>
            <Switch id="sistem" name="sistem" checked={form.sistem} onCheckedChange={checked => setForm(f => ({ ...f, sistem: checked }))} />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Anulează</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvează
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
