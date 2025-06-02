"use client"

import { useQuery } from "@tanstack/react-query"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Users, FileText, Building2, FolderOpen } from "lucide-react"
import axios from "axios"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  // Query pentru statisticile dashboard-ului
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/stats')
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea statisticilor')
      }
      return response.data.data
    }
  })

  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <div className="text-center text-red-600 p-4">
          Eroare la încărcarea statisticilor: {error.message}
        </div>
      </div>
    )
  }

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num?.toLocaleString() || '0'
  }

  const formatPercentage = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, isPositive: true }
    const percentage = ((current - previous) / previous) * 100
    return {
      value: Math.abs(percentage).toFixed(1),
      isPositive: percentage >= 0
    }
  }

  // Calculează procentajele pentru fiecare statistică
  const inregistrariTrend = formatPercentage(
    stats?.inregistrari?.thisMonth || 0,
    stats?.inregistrari?.lastMonth || 0
  )

  const utilizatoriTrend = formatPercentage(
    stats?.utilizatori?.total || 0,
    stats?.utilizatori?.lastMonthTotal || 0
  )

  const documenteTrend = formatPercentage(
    stats?.documente?.thisMonth || 0,
    stats?.documente?.lastMonth || 0
  )

  const registreTrend = formatPercentage(
    stats?.registre?.active || 0,
    stats?.registre?.lastMonthActive || 0
  )

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      
      {/* Total Înregistrări */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Înregistrări</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats?.inregistrari?.total || 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {inregistrariTrend.isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {inregistrariTrend.isPositive ? '+' : '-'}{inregistrariTrend.value}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {inregistrariTrend.isPositive ? 'Creștere' : 'Scădere'} față de luna trecută
            {inregistrariTrend.isPositive ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {stats?.inregistrari?.thisMonth || 0} înregistrări luna aceasta
          </div>
        </CardFooter>
      </Card>

      {/* Utilizatori Activi */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Utilizatori Activi</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.utilizatori?.active || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {utilizatoriTrend.isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {utilizatoriTrend.isPositive ? '+' : '-'}{utilizatoriTrend.value}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Users className="size-4" />
            {stats?.utilizatori?.total || 0} utilizatori în total
          </div>
          <div className="text-muted-foreground">
            Activitate în ultimele 30 zile
          </div>
        </CardFooter>
      </Card>

      {/* Documente Procesate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Documente Procesate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats?.documente?.total || 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {documenteTrend.isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {documenteTrend.isPositive ? '+' : '-'}{documenteTrend.value}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <FileText className="size-4" />
            {stats?.documente?.thisMonth || 0} documente luna aceasta
          </div>
          <div className="text-muted-foreground">
            {stats?.documente?.pending || 0} în așteptare
          </div>
        </CardFooter>
      </Card>

      {/* Registre Active */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Registre Active</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.registre?.active || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {registreTrend.isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {registreTrend.isPositive ? '+' : '-'}{registreTrend.value}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Building2 className="size-4" />
            {stats?.departamente?.total || 0} departamente
          </div>
          <div className="text-muted-foreground">
            Distribuite în toate departamentele
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}