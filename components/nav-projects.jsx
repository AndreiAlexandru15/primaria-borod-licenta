"use client"

import { FolderOpen, MoreHorizontal, FileText, Users, Settings, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdaugaInregistrareModal } from "@/components/adauga-inregistrare-modal";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
  isLoading = false
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [selectedRegistru, setSelectedRegistru] = useState(null)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  // Handler pentru "Vezi Înregistrările" (Vezi Registre)
  const handleVeziInregistrari = (registru) => {
    // Navighează la pagina cu înregistrările registrului
    const departmentId = registru.departamentId || registru.department_id
    if (!departmentId) {
      console.error('Department ID not found for register:', registru)
      return
    }
    router.push(`/dashboard/e-registratura/${departmentId}/${registru.id}`)
  }

  // Handler pentru "Document Nou"
  const handleDocumentNou = (registru) => {
    setSelectedRegistru(registru)
    setShowDocumentModal(true)
  }
  // Handler pentru "Vezi Departamentul"
  const handleVeziDepartamentul = (registru) => {
    // Navighează la pagina departamentului
    const departmentId = registru.departamentId || registru.department_id
    if (!departmentId) {
      console.error('Department ID not found for register:', registru)
      return
    }
    router.push(`/dashboard/e-registratura/${departmentId}`)
  }

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Registre</SidebarGroupLabel>
        <SidebarMenu>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-2 py-1">
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    )
  }
  return (
    (<SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Registre</SidebarGroupLabel>
      <SidebarMenu className="space-y-1"> {/* Reduced spacing */}
        {projects.slice(0, 8).map((item) => (
          <SidebarMenuItem key={item.id} className="mb-1"> {/* Reduced margin */}
            <SidebarMenuButton asChild className="h-12 py-2">
              <a href={item.url} title={`${item.name} - ${item.department}`}>
                <item.icon />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-2" title={item.department}>
                    <span>{item.department}</span>
                    <span className="mx-1">•</span>
                    <span>{item.count} doc.</span>
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">Opțiuni</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}>
                <DropdownMenuItem onClick={() => handleVeziInregistrari(item)}>
                  <BookOpen className="text-muted-foreground" />
                  <span>Vezi Înregistrările</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDocumentNou(item)}>
                  <FileText className="text-muted-foreground" />
                  <span>Document Nou</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleVeziDepartamentul(item)}>
                  <Users className="text-muted-foreground" />
                  <span>Vezi Departamentul</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        {projects.length > 8 && (
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="text-sidebar-foreground/70"
              asChild
            >
              <a href="/dashboard/e-registratura">
                <MoreHorizontal />
                <span>Vezi toate registrele ({projects.length})</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        {projects.length === 0 && !isLoading && (
          <SidebarMenuItem>
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Nu există registre disponibile
            </div>
          </SidebarMenuItem>        )}
      </SidebarMenu>
      
      {/* Modal pentru adăugarea de documente noi */}
      {selectedRegistru && (
        <AdaugaInregistrareModal 
          departamentId={selectedRegistru.departamentId || selectedRegistru.department_id}
          registruId={selectedRegistru.id}
          isOpen={showDocumentModal}
          onOpenChange={setShowDocumentModal}
          trigger={null} // Nu afișa trigger-ul default
        />
      )}
    </SidebarGroup>)
  );
}
