"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Calendar, FileText, Users, Building2, BarChart3, Filter, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select"                
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { toast } from "sonner"

export default function RapoartePage() {
  const [selectedReportType, setSelectedReportType] = useState("")
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1), // 1 ianuarie anul curent
    to: new Date()
  })  
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedRegister, setSelectedRegister] = useState("all")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)

  // Fetch departamente
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments-for-reports'],
    queryFn: async () => {
      const response = await fetch('/api/departamente')
      if (!response.ok) throw new Error('Eroare la încărcarea departamentelor')
      return response.json()
    }
  })  // Fetch registre
  const { data: registersResponse } = useQuery({
    queryKey: ['registers-for-reports', selectedDepartment],
    queryFn: async () => {
      const url = selectedDepartment !== "all"
        ? `/api/registru?departmentId=${selectedDepartment}`
        : '/api/registru?toate=true'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Eroare la încărcarea registrelor')
      return response.json()
    },
    enabled: true
  })

  const departments = departmentsResponse?.data || []
  const registers = registersResponse?.data || []

  // Tipurile de rapoarte disponibile
  const reportTypes = [
    {
      id: "inregistrari-perioada",
      name: "Înregistrări pe Perioadă",
      description: "Raport cu toate înregistrările dintr-o anumită perioadă",
      icon: Calendar
    },
    {
      id: "statistici-departament",
      name: "Statistici Departament",
      description: "Analiza activității pe departament",
      icon: Building2
    },
    {
      id: "documente-categorie",
      name: "Documente pe Categorii",
      description: "Raport cu documentele grupate pe categorii",
      icon: FileText
    },
    {
      id: "activitate-utilizatori",
      name: "Activitatea Utilizatorilor",
      description: "Statistici despre activitatea utilizatorilor",
      icon: Users
    },
    {
      id: "raport-anual",
      name: "Raport Anual",
      description: "Raport complet pentru un an întreg",
      icon: BarChart3
    }
  ]

  // Funcție pentru generarea raportului
  const generateReport = async () => {
    if (!selectedReportType) {
      toast.error("Selectați tipul de raport")
      return
    }

    setLoading(true)
    try {      const params = new URLSearchParams({
        tip: selectedReportType,
        dataStart: dateRange.from?.toISOString().split('T')[0] || '',
        dataEnd: dateRange.to?.toISOString().split('T')[0] || '',
        ...(selectedDepartment !== "all" && { departamentId: selectedDepartment }),
        ...(selectedRegister !== "all" && { registruId: selectedRegister })
      })

      const response = await fetch(`/api/rapoarte?${params}`)
      if (!response.ok) throw new Error('Eroare la generarea raportului')
      
      const data = await response.json()
      setReportData(data)
      toast.success("Raportul a fost generat cu succes")
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error("Eroare la generarea raportului")
    } finally {
      setLoading(false)
    }
  }

  // Component pentru afișarea datelor tabelului
  const RenderReportTable = ({ data, type }) => {
    // Validare specifică pentru fiecare tip de raport
    const isEmpty = () => {
      if (!data) return true;
      
      // Pentru raporturile care returnează array-uri
      if (type === "inregistrari-perioada" || type === "documente-categorie" || type === "activitate-utilizatori") {
        return !Array.isArray(data) || data.length === 0;
      }
        // Pentru raporturile care returnează obiecte
      if (type === "statistici-departament") {
        return !data.statistici && !data.detalii;
      }
      
      if (type === "raport-anual") {
        return !data.rezumat && !data.evolutieLunara;
      }
      
      // Pentru alte tipuri, verifică dacă e array sau obiect gol
      if (Array.isArray(data)) {
        return data.length === 0;
      }
      
      return Object.keys(data).length === 0;
    };

    if (isEmpty()) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nu există date pentru afișare
        </div>
      )
    }

    switch (type) {
      case "inregistrari-perioada":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr. Înregistrare</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Expeditor</TableHead>
                <TableHead>Obiect</TableHead>
                <TableHead>Departament</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.numarInregistrare}</TableCell>
                  <TableCell>{new Date(item.dataInregistrare).toLocaleDateString('ro-RO')}</TableCell>
                  <TableCell>{item.expeditor || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.obiect}</TableCell>
                  <TableCell>{item.departament}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'activa' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "statistici-departament":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.statistici && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Înregistrări</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.statistici.totalInregistrari}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Documente Procesate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.statistici.totalDocumente}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Utilizatori Activi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.statistici.utilizatoriActivi}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            {data.detalii && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registru</TableHead>
                    <TableHead>Înregistrări</TableHead>
                    <TableHead>Documente</TableHead>
                    <TableHead>Ultima Activitate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.detalii.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.numeRegistru}</TableCell>
                      <TableCell>{item.numarInregistrari}</TableCell>
                      <TableCell>{item.numarDocumente}</TableCell>
                      <TableCell>
                        {item.ultimaActivitate 
                          ? new Date(item.ultimaActivitate).toLocaleDateString('ro-RO')
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}          </div>
        )

      case "documente-categorie":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categorie</TableHead>
                <TableHead>Număr Documente</TableHead>
                <TableHead>Dimensiune (MB)</TableHead>
                <TableHead>Departamente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.categorie}</TableCell>
                  <TableCell>{item.numarDocumente}</TableCell>
                  <TableCell>{item.dimensiuneTotalaMB}</TableCell>
                  <TableCell>
                    {item.departamente && item.departamente.length > 0 
                      ? item.departamente.join(', ')
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))}            </TableBody>
          </Table>
        )

      case "activitate-utilizatori":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizator</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Funcție</TableHead>
                <TableHead>Număr Activități</TableHead>
                <TableHead>Ultima Activitate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.nume}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.functie || '-'}</TableCell>
                  <TableCell>{item.numarActivitati}</TableCell>
                  <TableCell>
                    {item.ultimaActivitate 
                      ? new Date(item.ultimaActivitate).toLocaleDateString('ro-RO')
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>        )
        
      case "raport-anual":
        return (
          <div className="space-y-6">
            {data.rezumat && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Înregistrări</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.rezumat.totalInregistrari}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Documente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.rezumat.totalDocumente}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Departamente Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.rezumat.totalDepartamente}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Registre Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.rezumat.totalRegistre}</div>
                  </CardContent>
                </Card>
              </div>
            )}
            {data.evolutieLunara && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Luna</TableHead>
                    <TableHead>Înregistrări</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.evolutieLunara.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.numeLuna}</TableCell>
                      <TableCell>{item.inregistrari}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>        )
        
      default:
        return (
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(data[0] || {}).map((key) => (
                  <TableHead key={key}>{key}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {Object.values(item).map((value, idx) => (
                    <TableCell key={idx}>
                      {typeof value === 'object' && value !== null 
                        ? JSON.stringify(value) 
                        : String(value || '-')
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapoarte</h1>
          <p className="text-muted-foreground">
            Generați și exportați rapoarte detaliate despre activitatea din registratură
          </p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generare Rapoarte</TabsTrigger>
          <TabsTrigger value="view">Vizualizare Date</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Configurare Raport
              </CardTitle>
              <CardDescription>
                Selectați tipul de raport și criteriile de filtrare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selectare tip raport */}
              <div className="space-y-2">
                <Label htmlFor="report-type">Tipul Raportului</Label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectați tipul de raport" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selectare perioada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Start</Label>
                  <Input
                    type="date"
                    value={dateRange.from?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Sfârșit</Label>
                  <Input
                    type="date"
                    value={dateRange.to?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Filtre opționale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                <div className="space-y-2">
                  <Label htmlFor="department">Departament (opțional)</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toate departamentele" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate departamentele</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.nume}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>                
                <div className="space-y-2">
                  <Label htmlFor="register">Registru (opțional)</Label>
                  <Select value={selectedRegister} onValueChange={setSelectedRegister}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toate registrele" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate registrele</SelectItem>
                      {registers.map((reg) => (
                        <SelectItem key={reg.id} value={reg.id}>
                          {reg.nume} ({reg.departament?.nume})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Butoane de acțiune */}              <div className="flex gap-2">
                <Button onClick={generateReport} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="mr-2 h-4 w-4" />
                  )}
                  Generează Raport
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Afișarea rezultatelor */}
          {reportData && (
            <Card>
              <CardHeader>
                <CardTitle>Rezultate Raport</CardTitle>
                <CardDescription>
                  {reportTypes.find(t => t.id === selectedReportType)?.name} - 
                  {dateRange.from?.toLocaleDateString('ro-RO')} - {dateRange.to?.toLocaleDateString('ro-RO')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedReportType === 'statistici-departament' ? (
                  <RenderReportTable data={reportData.data} type={selectedReportType} />
                ) : (
                  <RenderReportTable data={reportData.data} type={selectedReportType} />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Înregistrări</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +12% față de luna trecută
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departamente Active</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departments.length}</div>
                <p className="text-xs text-muted-foreground">
                  Funcționale în sistem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registre Totale</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{registers.length}</div>
                <p className="text-xs text-muted-foreground">
                  În toate departamentele
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilizatori Activi</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  Logați în ultimele 7 zile
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activitatea Lunară</CardTitle>
              <CardDescription>
                Numărul de înregistrări procesate pe luni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartAreaInteractive />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}