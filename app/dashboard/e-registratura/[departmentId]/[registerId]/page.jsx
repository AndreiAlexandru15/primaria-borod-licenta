/**
 * Pagina înregistrărilor pentru un registru specific
 * @fileoverview Afișează înregistrările din registru
 */
"use client"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { ListaInregistrari } from "@/components/lista-inregistrari"
import { AdaugaInregistrareModal } from "@/components/adauga-inregistrare-modal"
import React, { useRef } from "react"

export default function RegistruInregistrariPage({ params }) {
  const { departmentId, registerId } = React.use(params)
  const listaRef = useRef();
  // Formatul de export selectat (default: excel)
  const [exportFormat, setExportFormat] = React.useState("excel")

  return (
    <SidebarProvider>
      <AppSidebar />      <SidebarInset>
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
              <select
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                style={{ height: 36 }}
                aria-label="Format export"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
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
      </SidebarInset>
    </SidebarProvider>
  )
}
