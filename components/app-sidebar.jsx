"use client"

import * as React from "react"
import {
  Archive,
  BarChart3,
  Building2,
  FileText,
  FolderOpen,
  Home,
  LifeBuoy,
  LogOut,
  Settings2,
  Users,
  UserCheck,
  Command,
  BookOpen
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useRegisters } from "@/hooks/use-registers"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "E-Registratură",
      url: "/dashboard/e-registratura",
      icon: FolderOpen,
      items: [
        {
          title: "Departamente",
          url: "/dashboard/e-registratura",
        },
        {
          title: "Registre",
          url: "/dashboard/e-registratura/registre",
        },
        {
          title: "Căutare Avansată",
          url: "/dashboard/e-registratura/cautare",
        }
      ]
    },
    {
      title: "Documente",
      url: "/dashboard/documente",
      icon: FileText,
      items: [
        {
          title: "Document Nou",
          url: "/dashboard/documente/nou",
        },
        {
          title: "Toate Documentele",
          url: "/dashboard/documente",
        },
        {
          title: "În Așteptare",
          url: "/dashboard/documente/pending",
        },
        {
          title: "Finalizate",
          url: "/dashboard/documente/completed",
        }
      ]
    },
    {
      title: "Administrare",
      url: "/dashboard/admin",
      icon: Settings2,
      items: [
        {
          title: "Utilizatori",
          url: "/dashboard/admin/utilizatori",
        },
        {
          title: "Departamente",
          url: "/dashboard/admin/departamente",
        },
        {
          title: "Roluri & Permisiuni",
          url: "/dashboard/admin/roluri",
        },
        {
          title: "Configurări",
          url: "/dashboard/admin/configurari",
        }
      ]
    },
  ],
  navSecondary: [
    {
      title: "Arhivă",
      url: "/dashboard/arhiva",
      icon: Archive,
    },
    {
      title: "Rapoarte",
      url: "/dashboard/rapoarte",
      icon: BarChart3,
    },
    {
      title: "Suport",
      url: "/dashboard/suport",
      icon: LifeBuoy,
    },  ],
}

export function AppSidebar({
  ...props
}) {
  const { data: registers = [], isLoading: isLoadingRegisters } = useRegisters();
  const { user, loading } = useCurrentUser();
  // Transform registers data for NavProjects component
  const registersForNavigation = registers.map(register => ({
    id: register.id,
    name: register.nume,
    url: `/dashboard/e-registratura/${register.departament.id}/${register.id}`,
    icon: BookOpen,
    description: register.descriere,
    department: register.departament.cod, // show code instead of name
    count: register._count?.inregistrari || 0
  }))

  return (
    (<Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div
                  className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">E-Registratura</span>
                  <span className="truncate text-xs">Primăria Borod</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects 
          projects={registersForNavigation} 
          isLoading={isLoadingRegisters}
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {loading ? (
          <span className="text-xs text-muted-foreground px-4 py-2">Se încarcă utilizatorul...</span>
        ) : user ? (
          <NavUser user={{
            name: user.nume + (user.prenume ? ' ' + user.prenume : ''),
            email: user.email,
            avatar: user.avatar || undefined
          }} />
        ) : (
          <span className="text-xs text-muted-foreground px-4 py-2">Nu ești autentificat</span>
        )}
      </SidebarFooter>
    </Sidebar>)
  );
}
