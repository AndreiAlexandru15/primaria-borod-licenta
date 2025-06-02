import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Plus } from "lucide-react"
import axios from "axios"

export default function AddRoleDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    nume: "",
    descriere: "",
    nivelAcces: 1,
    sistem: false,
    permisiuni: []
  })

  const [permisiuni, setPermisiuni] = useState([])
  const [loadingPermisiuni, setLoadingPermisiuni] = useState(false)

  // Încarcă permisiunile la prima deschidere
  useEffect(() => {
    if (open && permisiuni.length === 0) {
      fetchPermisiuni()
    }
  }, [open, permisiuni.length])

  const fetchPermisiuni = async () => {
    try {
      setLoadingPermisiuni(true)
      const response = await axios.get('/api/permisiuni')
      if (response.data.success) {
        setPermisiuni(response.data.data)
      }
    } catch (error) {
      console.error('Eroare la încărcarea permisiunilor:', error)
    } finally {
      setLoadingPermisiuni(false)
    }
  }
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handlePermissionChange = (permisiuneId, checked) => {
    setForm((prev) => ({
      ...prev,
      permisiuni: checked 
        ? [...prev.permisiuni, permisiuneId]
        : prev.permisiuni.filter(id => id !== permisiuneId)
    }))
  }

  const resetForm = () => {
    setForm({
      nume: "",
      descriere: "",
      nivelAcces: 1,
      sistem: false,
      permisiuni: []
    })
  }

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  // Grupează permisiunile după modul
  const permisiuniGrupate = permisiuni.reduce((acc, permisiune) => {
    if (!acc[permisiune.modul]) {
      acc[permisiune.modul] = []
    }
    acc[permisiune.modul].push(permisiune)
    return acc
  }, {})
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Adaugă Rol
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Adaugă Rol Nou</DialogTitle>
          <DialogDescription>Completează detaliile pentru rolul nou și selectează permisiunile</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
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
            
            {/* Secțiunea de permisiuni */}
            <div className="grid grid-cols-4 items-start gap-4 mt-4">
              <Label className="text-right">Permisiuni</Label>
              <div className="col-span-3">
                {loadingPermisiuni ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Se încarcă permisiunile...</span>
                  </div>
                ) : (
                  <div className="space-y-4 border rounded-lg p-4 max-h-60 overflow-y-auto">
                    {Object.entries(permisiuniGrupate).map(([modul, permisiuniModul]) => (
                      <div key={modul} className="space-y-2">
                        <h4 className="font-semibold text-sm capitalize">{modul}</h4>
                        <div className="grid grid-cols-1 gap-2 ml-4">
                          {permisiuniModul.map((permisiune) => (
                            <div key={permisiune.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`permission-${permisiune.id}`}
                                checked={form.permisiuni.includes(permisiune.id)}
                                onCheckedChange={(checked) => handlePermissionChange(permisiune.id, checked)}
                              />
                              <Label htmlFor={`permission-${permisiune.id}`} className="text-sm">
                                {permisiune.nume} - {permisiune.descriere}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>Anulează</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvează
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
