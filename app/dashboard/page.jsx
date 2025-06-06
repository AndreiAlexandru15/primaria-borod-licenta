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
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { ListaInregistrari } from "@/components/lista-inregistrari"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export default function Page() {
  const [registerId, setRegisterId] = useState("")
  const listaRef = useRef(null)  // Fetch registers using tanstack-query
  const { data: registersResponse, isLoading: registersLoading, error: registersError } = useQuery({
    queryKey: ['registers'],
    queryFn: async () => {
      const response = await axios.get('/api/registru?toate=true')
      return response.data
    },
    retry: 3,
    retryDelay: 1000
  })

  const registers = registersResponse?.data || []
  // Debug logging
  useEffect(() => {
    if (registersError) {
      console.error('Error loading registers:', registersError)
    }
    if (registersResponse) {
      console.log('Registers response:', registersResponse)
      console.log('Registers array:', registers)
      console.log('Registers length:', registers.length)
    }
  }, [registersError, registersResponse, registers])
  // Set default values when data is loaded
  useEffect(() => {
    console.log('Setting default register. Registers length:', registers.length, 'Current registerId:', registerId)
    if (registers.length > 0 && !registerId) {
      console.log('Setting first register:', registers[0])
      setRegisterId(registers[0].id.toString())
    }
  }, [registers, registerId])


  
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
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
              
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>          <div className="px-4 lg:px-6">
            {/* Filtru pentru register ID */}            <div className="mb-6">
              <div className="space-y-2 w-64">
                <Label htmlFor="register-select">Register</Label>
                {registersLoading ? (
                  <div className="text-sm text-muted-foreground">Se încarcă registrele...</div>
                ) : (                  <Select value={registerId} onValueChange={setRegisterId}>
                    <SelectTrigger id="register-select" className="w-full">
                      <SelectValue 
                        placeholder="Selectează registrul"
                        className="truncate"
                      >
                        <span className="truncate">
                          {registerId && registers.find(r => r.id.toString() === registerId)?.nume || "Selectează registrul"}
                        </span>
                      </SelectValue>
                    </SelectTrigger><SelectContent className="max-w-none w-auto min-w-[300px]">
                      {registers.map((register) => (
                        <SelectItem 
                          key={register.id} 
                          value={register.id.toString()}
                          className="max-w-none"
                        >
                          <div className="flex flex-col items-start py-1">
                            <span className="font-medium">
                              {register.nume || `Register ${register.id}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {register.departament?.cod || 'Fără departament'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div><ListaInregistrari 
              ref={listaRef} 
              registerId={registerId} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}