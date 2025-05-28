import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Users, 
  Archive, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Building2,
  Calendar,
  BarChart3
} from "lucide-react"

export default function Page() {
  const stats = {
    totalDocuments: 1247,
    pendingDocuments: 23,
    completedToday: 15,
    totalDepartments: 8,
    activeUsers: 12,
    archivedDocuments: 892
  }

  const recentActivities = [
    {
      id: 1,
      type: "document",
      title: "Cerere autorizație construire",
      department: "Urbanism",
      time: "Acum 15 minute",
      status: "pending"
    },
    {
      id: 2,
      type: "document",
      title: "Solicitare certificat fiscal",
      department: "Financiar",
      time: "Acum 1 oră",
      status: "completed"
    },
    {
      id: 3,
      type: "user",
      title: "Utilizator nou înregistrat",
      department: "IT",
      time: "Acum 2 ore",
      status: "info"
    }
  ]

  const quickActions = [
    {
      title: "Document Nou",
      description: "Înregistrează un document nou",
      icon: FileText,
      href: "/dashboard/documente/nou",
      color: "bg-blue-500"
    },
    {
      title: "Gestionare Departamente",
      description: "Administrează departamentele",
      icon: Building2,
      href: "/dashboard/departamente",
      color: "bg-green-500"
    },
    {
      title: "Utilizatori",
      description: "Gestionează utilizatorii",
      icon: Users,
      href: "/dashboard/utilizatori",
      color: "bg-purple-500"
    },
    {
      title: "Arhivă",
      description: "Accesează arhiva documentelor",
      icon: Archive,
      href: "/dashboard/arhiva",
      color: "bg-orange-500"
    }
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard Principal</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
          {/* Welcome Section */}
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Bun venit în E-Registratură</h1>
            <p className="text-muted-foreground">
              Sistemul de management al documentelor pentru Primăria Borod
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documente</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                <p className="text-xs text-muted-foreground">
                  +12% față de luna trecută
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">În Așteptare</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingDocuments}</div>
                <p className="text-xs text-muted-foreground">
                  Necesită atenție
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finalizate Azi</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedToday}</div>
                <p className="text-xs text-muted-foreground">
                  +3 față de ieri
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departamente</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDepartments}</div>
                <p className="text-xs text-muted-foreground">
                  Toate active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilizatori Activi</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Online acum
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Arhivă</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.archivedDocuments}</div>
                <p className="text-xs text-muted-foreground">
                  Documente arhivate
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acțiuni Rapide</CardTitle>
                <CardDescription>
                  Funcționalități utilizate frecvent
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    asChild
                  >
                    <a href={action.href}>
                      <div className={`${action.color} text-white p-2 rounded-md mr-4`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Activitate Recentă</CardTitle>
                <CardDescription>
                  Ultimele acțiuni din sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {activity.status === "pending" && (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                        {activity.status === "completed" && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {activity.status === "info" && (
                          <FileText className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.department} • {activity.time}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          activity.status === "pending" ? "secondary" : 
                          activity.status === "completed" ? "default" : "outline"
                        }
                      >
                        {activity.status === "pending" ? "În așteptare" :
                         activity.status === "completed" ? "Finalizat" : "Info"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  Vezi toate activitățile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performanță Lunară</CardTitle>
              <CardDescription>
                Statistici privind procesarea documentelor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Graficul de performanță va fi implementat aici
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
