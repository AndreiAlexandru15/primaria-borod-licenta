import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function AdaugaCategorieModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  confidentialitati = []
}) {
  const [form, setForm] = useState({
    nume: "",
    cod: "",
    descriere: "",
    perioadaRetentie: 0,
    confidentialitateDefaultId: "",
    metadateObligatorii: {},
    active: true
  })

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleSelectChange = (value, name) => {
    setForm((prev) => ({
      ...prev,
      [name]: value === "null" ? "" : value
    }))
  }

  const handleSwitchChange = (checked) => {
    setForm((prev) => ({
      ...prev,
      active: checked
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const resetForm = () => {
    setForm({
      nume: "",
      cod: "",
      descriere: "",
      perioadaRetentie: 0,
      confidentialitateDefaultId: "",
      metadateObligatorii: {},
      active: true
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
          Adaugă Categorie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adaugă Categorie Nouă</DialogTitle>
          <DialogDescription>
            Completează detaliile pentru categoria de documente nouă
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nume" className="text-right">
              Nume*
            </Label>
            <Input 
              id="nume" 
              name="nume" 
              className="col-span-3" 
              value={form.nume} 
              onChange={handleChange} 
              placeholder="ex: Financiar, Juridic, HR"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cod" className="text-right">
              Cod*
            </Label>
            <Input 
              id="cod" 
              name="cod" 
              className="col-span-3" 
              value={form.cod} 
              onChange={handleChange} 
              placeholder="ex: FIN, JUR, HR"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="perioadaRetentie" className="text-right">
              Perioada Retenție (ani)
            </Label>
            <Input 
              id="perioadaRetentie" 
              name="perioadaRetentie" 
              type="number"
              className="col-span-3" 
              value={form.perioadaRetentie} 
              onChange={handleChange} 
              placeholder="ex: 5, 10, 15"
              min="0"
              max="100"
            />
          </div>          
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confidentialitateDefaultId" className="text-right">
              Confidențialitate
            </Label>
            <Select 
              value={form.confidentialitateDefaultId || undefined} 
              onValueChange={(value) => handleSelectChange(value, "confidentialitateDefaultId")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selectează nivelul de confidențialitate (opțional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Fără confidențialitate</SelectItem>
                {confidentialitati.map((conf) => (
                  <SelectItem key={conf.id} value={conf.id}>
                    {conf.denumire} ({conf.cod})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descriere" className="text-right">
              Descriere
            </Label>
            <Textarea 
              id="descriere" 
              name="descriere" 
              className="col-span-3" 
              value={form.descriere} 
              onChange={handleChange} 
              placeholder="Descriere detaliată a categoriei de documente"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="active" className="text-right">
              Activă
            </Label>
            <Switch
              id="active"
              checked={form.active}
              onCheckedChange={handleSwitchChange}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adaugă Categorie
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
