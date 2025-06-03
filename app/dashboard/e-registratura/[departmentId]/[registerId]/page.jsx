/**
 * Pagina înregistrărilor pentru un registru specific
 * @fileoverview Afișează înregistrările din registru
 */
"use client"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { ListaInregistrari } from "@/components/lista-inregistrari"
import { AdaugaInregistrareModal } from "@/components/adauga-inregistrare-modal"
import React, { useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegistruInregistrariPage({ params }) {
  const { departmentId, registerId } = React.use(params)
  const listaRef = useRef();
  // Formatul de export selectat (default: excel)
  const [exportFormat, setExportFormat] = React.useState("excel")

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between w-full px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/e-registratura">
                    E-Registratură
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/dashboard/e-registratura/${departmentId}`}>
                    Registre
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Înregistrări</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>            <div className="flex gap-2 items-center">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="">
                <SelectValue placeholder="Format export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => listaRef.current?.handleExport && listaRef.current.handleExport(exportFormat)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <AdaugaInregistrareModal departamentId={departmentId} registruId={registerId} />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <ListaInregistrari ref={listaRef} departmentId={departmentId} registerId={registerId} />
      </div>
    </div>
  )
}
