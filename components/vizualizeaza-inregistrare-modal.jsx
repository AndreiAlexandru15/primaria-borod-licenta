/**
 * Modal pentru vizualizarea detaliilor unei înregistrări
 * @fileoverview Modal pentru afișarea informațiilor complete ale unei înregistrări
 */

"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Calendar,
  User,
  Hash,
  AlertTriangle,
  Download,
  Eye
} from "lucide-react"

export function VizualizeazaInregistrareModal({ 
  isOpen,
  onOpenChange,
  inregistrare 
}) {
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (inregistrare) => {
    if (inregistrare.urgent && inregistrare.confidential) {
      return <Badge variant="destructive">Urgent & Confidențial</Badge>
    }
    if (inregistrare.urgent) {
      return <Badge variant="destructive">Urgent</Badge>
    }
    if (inregistrare.confidential) {
      return <Badge variant="secondary">Confidențial</Badge>
    }
    return <Badge variant="outline">Normal</Badge>
  }

  if (!inregistrare) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalii Înregistrare #{inregistrare.numarInregistrare}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informații principale */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Hash className="h-4 w-4" />
                Număr Înregistrare
              </div>
              <p className="font-semibold">{inregistrare.numarInregistrare}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Data Înregistrare
              </div>
              <p>{formatDate(inregistrare.dataInregistrare)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Expeditor
              </div>
              <p>{inregistrare.expeditor || '-'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Destinatar
              </div>
              <p>
                {inregistrare.destinatarNume ? (
                  <>
                    {inregistrare.destinatarNume}
                    {inregistrare.destinatarFunctie && ` (${inregistrare.destinatarFunctie})`}
                  </>
                ) : '-'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Detalii document */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalii Document
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Număr Document
                </div>
                <p>{inregistrare.numarDocument || '-'}</p>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Data Document
                </div>
                <p>{inregistrare.dataFisier ? formatDate(inregistrare.dataFisier) : '-'}</p>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Tip Document
                </div>
                <p>{inregistrare.tipDocumentDenumire || '-'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Confidențialitate
                </div>
                <p>{inregistrare.confidentialitateFisierDenumire || inregistrare.confidentialitate?.denumire || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Obiect și observații */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Obiect
              </div>
              <p className="text-sm leading-relaxed bg-gray-50 p-3 rounded-md">
                {inregistrare.obiect}
              </p>
            </div>

            {inregistrare.observatii && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Observații
                </div>
                <p className="text-sm leading-relaxed bg-gray-50 p-3 rounded-md">
                  {inregistrare.observatii}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Status și fișier */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Status
              </div>
              {getStatusBadge(inregistrare)}
            </div>

            {inregistrare.fisierPath && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={inregistrare.fisierPath} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descarcă Fișier
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Închide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
