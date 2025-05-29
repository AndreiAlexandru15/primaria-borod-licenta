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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Building2, 
  Shield, 
  Settings, 
  FileText,
  Activity,
  Database,
  Clock
} from "lucide-react"

export default function AdminPage() {
  const adminCards = [
    {
      title: "Utilizatori",
      description: "Gestionează conturile utilizatorilor și accesul la sistem",
      icon: Users,
      href: "/dashboard/admin/utilizatori",
      stats: "12 utilizatori activi",
      color: "bg-blue-500"
    },
    {
      title: "Departamente",
      description: "Administrează structura organizațională a primăriei",
      icon: Building2,
      href: "/dashboard/admin/departamente",
      stats: "8 departamente",
      color: "bg-green-500"
    },
    {
      title: "Roluri & Permisiuni",
      description: "Configurează rolurile și permisiunile de acces",
      icon: Shield,
      href: "/dashboard/admin/roluri",
      stats: "5 roluri definite",
      color: "bg-purple-500"
    },
    {
      title: "Configurări Sistem",
      description: "Setări generale ale aplicației și parametri",
      icon: Settings,
      href: "/dashboard/admin/configurari",
      stats: "Sistem operational",
      color: "bg-orange-500"
    },
    {
      title: "Audit Log",
      description: "Vizualizează logurile de activitate și securitate",
      icon: Activity,
      href: "/dashboard/admin/audit",
      stats: "1247 înregistrări",
      color: "bg-red-500"
    },
    {
      title: "Backup & Restore",
      description: "Gestionează backup-urile bazei de date",
      icon: Database,
      href: "/dashboard/admin/backup",
      stats: "Ultimul backup: azi",
      color: "bg-indigo-500"
    }
  ]

  const recentActions = [
    {
      action: "Utilizator nou adăugat",
      user: "Maria Popescu",
      time: "Acum 2 ore",
      type: "success"
    },
    {
      action: "Departament actualizat",
      user: "Ion Ionescu",
      time: "Acum 3 ore",
      type: "info"
    },
    {
      action: "Rol modificat",
      user: "Ana Gheorghe",
      time: "Ieri, 14:30",
      type: "warning"
    }
  ]

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
                    <BreadcrumbPage>Administrare</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Panou de Administrare</h1>
            <p className="text-muted-foreground">
              Gestionează utilizatorii, permisiunile și configurările sistemului
            </p>
          </div>

          {/* Admin Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {adminCards.map((card, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {card.description}
                    </CardDescription>
                  </div>
                  <div className={`${card.color} text-white p-3 rounded-lg`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {card.stats}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={card.href}>
                        Accesează
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status Sistem</CardTitle>
                <CardDescription>
                  Informații despre starea actuală a sistemului
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Baza de Date</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Server Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Backup Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Actualizat</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Utilizatori Activi</span>
                  <span className="text-sm font-medium">12</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acțiuni Administrative Recente</CardTitle>
                <CardDescription>
                  Ultimele modificări efectuate de administratori
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {action.action}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {action.user} • {action.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Activity className="h-4 w-4 mr-2" />
                  Vezi toate acțiunile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
