/**
 * Pagina principală E-Registratură - Departamente
 * @fileoverview Afișează lista departamentelor pentru e-registratură
 */

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
import { ListaDepartamente } from "@/components/lista-departamente"
import { AdaugaDepartamentModal } from "@/components/adauga-departament-modal"

export default function ERegistraturaPage() {
  return (
    <div className="flex flex-1 flex-col h-full">
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
                  <BreadcrumbPage>E-Registratură</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <AdaugaDepartamentModal />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-y-auto min-h-0">
        <ListaDepartamente />
      </div>
    </div>
  )
}