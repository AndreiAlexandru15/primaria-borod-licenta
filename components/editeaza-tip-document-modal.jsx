import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function EditeazaTipDocumentModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  tipDocument = null,
  registre = [],
  categorii = []
}) {
  const [form, setForm] = useState({
    id: "",
    nume: "",
    cod: "",
    descriere: "",
    registruId: "",
    categorieId: "",
    ordineSortare: 0,
    activ: true
  })

  // Update form when tipDocument changes
  useEffect(() => {
    if (tipDocument) {
      setForm({
        id: tipDocument.id || "",
        nume: tipDocument.nume || "",
        cod: tipDocument.cod || "",
        descriere: tipDocument.descriere || "",
        registruId: tipDocument.registruId || "",
        categorieId: tipDocument.categorieId || "",
        ordineSortare: tipDocument.ordineSortare || 0,
        activ: tipDocument.activ ?? true
      })
    }
  }, [tipDocument])

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
      activ: checked
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const resetForm = () => {
    setForm({
      id: "",
      nume: "",
      cod: "",
      descriere: "",
      registruId: "",
      categorieId: "",
      ordineSortare: 0,
      activ: true
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editează Tip Document</DialogTitle>
          <DialogDescription>
            Modifică detaliile tipului de document
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
              placeholder="ex: Hotărâre, Dispoziție, Contract"
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
              placeholder="ex: HOT, DISP, CONTR"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registruId" className="text-right">
              Registru*
            </Label>            <Select 
              value={form.registruId || undefined}
              onValueChange={(value) => handleSelectChange(value, "registruId")}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selectează registrul" />
              </SelectTrigger>
              <SelectContent>
                {registre.map((registru) => (
                  <SelectItem key={registru.id} value={registru.id}>
                    {registru.nume} ({registru.cod})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="categorieId" className="text-right">
              Categorie
            </Label>            <Select 
              value={form.categorieId || undefined}
              onValueChange={(value) => handleSelectChange(value, "categorieId")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selectează categoria (opțional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Fără categorie</SelectItem>
                {categorii.map((categorie) => (
                  <SelectItem key={categorie.id} value={categorie.id}>
                    {categorie.nume} ({categorie.cod})
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
              placeholder="Descriere detaliată a tipului de document"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ordineSortare" className="text-right">
              Ordine Sortare
            </Label>
            <Input 
              id="ordineSortare" 
              name="ordineSortare" 
              type="number"
              className="col-span-3" 
              value={form.ordineSortare} 
              onChange={handleChange} 
              placeholder="0"
              min="0"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="activ" className="text-right">
              Activ
            </Label>
            <Switch
              id="activ"
              checked={form.activ}
              onCheckedChange={handleSwitchChange}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvează Modificările
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
