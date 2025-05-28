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
  Command
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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
  user: {
    name: "Administrator",
    email: "admin@sector1.ro",
    avatar: "/avatars/admin.jpg",
  },
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
    },
  ],
  projects: [
    {
      name: "Urbanism",
      url: "/dashboard/e-registratura/1",
      icon: Building2,
    },
    {
      name: "Financiar",
      url: "/dashboard/e-registratura/2",
      icon: BarChart3,
    },
    {
      name: "Resurse Umane",
      url: "/dashboard/e-registratura/3",
      icon: Users,
    },
    {
      name: "Juridic",
      url: "/dashboard/e-registratura/4",
      icon: UserCheck,
    },
  ],
}

export function AppSidebar({
  ...props
}) {
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
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>)
  );
}
