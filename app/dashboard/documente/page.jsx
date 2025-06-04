/**
 * Pagina documentelor
 * @fileoverview Afișează lista documentelor cu posibilitatea de upload
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
import { Upload } from "lucide-react"
import { ListaDocumente } from "@/components/lista-documente"
import { useState } from "react"

export default function Documente() {
  const [showUploadModal, setShowUploadModal] = useState(false)

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
                </BreadcrumbItem>                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Documente</BreadcrumbPage>
                </BreadcrumbItem>              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload documente
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <ListaDocumente 
          externalUploadModalState={{ showUploadModal, setShowUploadModal }}
        />
      </div>
    </div>
  )
}
