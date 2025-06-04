"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Construction, Clock, Calendar, HelpCircle, Archive } from "lucide-react"

const iconMap = {
  Construction,
  HelpCircle,
  Archive,
  Clock,
  Calendar
}

export default function ComingSoon({ 
  title = "Pagină în Dezvoltare", 
  description = "Această funcționalitate urmează să fie implementată în curând.",
  iconName = "Construction",
  expectedDate,
  features = []
}) {
  const Icon = iconMap[iconName] || Construction
  return (
    <div className="flex flex-1 flex-col space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-muted rounded-full">
                <Icon className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Pagina urmează să fie construită</CardTitle>
            <CardDescription className="text-lg">
              Această funcționalitate este în proces de dezvoltare și va fi disponibilă în curând.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {expectedDate && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Data estimată: {expectedDate}</span>
              </div>
            )}
            
            {features.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Funcționalități planificate:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Badge variant="secondary" className="px-4 py-2">
                <Construction className="h-4 w-4 mr-2" />
                În dezvoltare
              </Badge>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Pentru întrebări sau sugestii, contactați echipa de dezvoltare.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
