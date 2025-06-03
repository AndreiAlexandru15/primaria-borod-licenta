"use client"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { ListaInregistrari } from "@/components/lista-inregistrari"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useDepartments } from "@/hooks/use-departments"
import axios from "axios"

export default function Page() {
  const [departmentId, setDepartmentId] = useState("")
  const [registerId, setRegisterId] = useState("")
  const listaRef = useRef(null)

  // Folosește hook-ul pentru departamente
  const { data: departments = [], isLoading: departmentsLoading, error: departmentsError } = useDepartments()

  // Fetch registers using tanstack-query
  const { data: registers = [], isLoading: registersLoading } = useQuery({
    queryKey: ['registers'],
    queryFn: async () => {
      const response = await axios.get('/api/registers')
      return response.data
    }
  })

  // Set default values when data is loaded
  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id.toString())
    }
  }, [departments, departmentId])

  useEffect(() => {
    if (registers.length > 0 && !registerId) {
      setRegisterId(registers[0].id.toString())
    }
  }, [registers, registerId])

  
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <div className="px-4 lg:px-6">
            {/* Filtre pentru departamente și register ID */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department-select">Departament</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger id="department-select">
                    <SelectValue placeholder="Selectează departamentul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate departamentele</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.nume || dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-select">Register ID</Label>
                <Select value={registerId} onValueChange={setRegisterId}>
                  <SelectTrigger id="register-select">
                    <SelectValue placeholder="Selectează registrul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate registrele</SelectItem>
                    {registers.map((register) => (
                      <SelectItem key={register.id} value={register.id.toString()}>
                        {register.name || `Register ${register.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ListaInregistrari 
              ref={listaRef} 
              departmentId={departmentId === "all" ? "" : departmentId} 
              registerId={registerId === "all" ? "" : registerId} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}