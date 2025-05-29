/**
 * Pagina înregistrărilor pentru un registru specific
 * @fileoverview Afișează înregistrările din registru
 */

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

export default function RegistruInregistrariPage({ params }) {
  const { departmentId, registerId } = params

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
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouă înregistrare
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ListaInregistrari departmentId={departmentId} registerId={registerId} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
