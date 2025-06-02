"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const chartConfig = {
  intrare: {
    label: "Intrare",
    color: "hsl(var(--chart-1))",
  },
  iesire: {
    label: "Ieșire", 
    color: "hsl(var(--chart-2))",
  },
  intern: {
    label: "Intern",
    color: "hsl(var(--chart-3))",
  }
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Query pentru datele graficului
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['chart-inregistrari', timeRange],
    queryFn: async () => {
      const response = await axios.get(`/api/dashboard/chart-data?period=${timeRange}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea datelor')
      }
      return response.data.data
    }
  })

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Înregistrări Zilnice</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Evoluția înregistrărilor pe tipuri de registru
          </span>
          <span className="@[540px]/card:hidden">Înregistrări pe tipuri</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex">
            <ToggleGroupItem value="90d">Ultimele 3 luni</ToggleGroupItem>
            <ToggleGroupItem value="30d">Ultimele 30 zile</ToggleGroupItem>
            <ToggleGroupItem value="7d">Ultimele 7 zile</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Selectează perioada">
              <SelectValue placeholder="Ultimele 3 luni" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Ultimele 3 luni
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Ultimele 30 zile
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Ultimele 7 zile
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillIntrare" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-intrare)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-intrare)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillIesire" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-iesire)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-iesire)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillIntern" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-intern)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-intern)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("ro-RO", {
                  month: "short",
                  day: "numeric",
                })
              }} />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("ro-RO", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  }}
                  indicator="dot" />
              } />
            <Area
              dataKey="intern"
              type="natural"
              fill="url(#fillIntern)"
              stroke="var(--color-intern)"
              stackId="a" />
            <Area
              dataKey="iesire"
              type="natural"
              fill="url(#fillIesire)"
              stroke="var(--color-iesire)"
              stackId="a" />
            <Area
              dataKey="intrare"
              type="natural"
              fill="url(#fillIntrare)"
              stroke="var(--color-intrare)"
              stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}