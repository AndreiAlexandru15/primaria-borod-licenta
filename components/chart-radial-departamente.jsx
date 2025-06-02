"use client"

import { Building2, TrendingUp } from "lucide-react"
import { RadialBar, RadialBarChart } from "recharts"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  inregistrari: {
    label: "Înregistrări",
  },
} 

export function ChartRadialDepartamente() {
  const { data: chartDataRaw, isLoading } = useQuery({
    queryKey: ['chart-radial-departamente'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/chart-radial-departamente')
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea datelor')
      }
      return response.data.data
    }
  })

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto aspect-square max-h-[250px] bg-gray-100 rounded-full animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  const chartData = chartDataRaw?.departamente || []
  const totalInregistrari = chartData.reduce((sum, item) => sum + item.inregistrari, 0)
  const tendintaLunara = chartDataRaw?.tendinta || 0

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Activitatea Departamentelor
        </CardTitle>
        <CardDescription>
          Înregistrări pe departament - luna curentă
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart data={chartData} innerRadius={30} outerRadius={110}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="departament" />}
            />
            <RadialBar dataKey="inregistrari" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {tendintaLunara >= 0 ? (
            <>
              Activitate în creștere cu {tendintaLunara.toFixed(1)}%
              <TrendingUp className="h-4 w-4 text-green-600" />
            </>
          ) : (
            <>
              Activitate în scădere cu {Math.abs(tendintaLunara).toFixed(1)}%
              <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Comparativ cu luna precedentă
        </div>
      </CardFooter>
    </Card>
  )
}