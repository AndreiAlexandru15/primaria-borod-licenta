"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Download,
  ExternalLink,
  RefreshCw,
  Info
} from "lucide-react"

export default function PostgreSQLStatus() {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)

  // Query pentru verificarea statusului PostgreSQL
  const {
    data: statusData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['postgresql-status'],
    queryFn: async () => {
      const response = await axios.get('/api/backup/check')
      return response.data.data
    },
    refetchInterval: 5000, // Check every 5 seconds
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Verificare PostgreSQL Tools...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Eroare</AlertTitle>
        <AlertDescription>
          Nu s-a putut verifica statusul PostgreSQL tools.
        </AlertDescription>
      </Alert>
    )
  }

  const { 
    pgDumpAvailable, 
    pgDumpVersion, 
    psqlAvailable, 
    psqlVersion,
    canCreateBackups,
    canRestoreBackups,
    instructions 
  } = statusData

  const allToolsAvailable = pgDumpAvailable && psqlAvailable

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allToolsAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Status PostgreSQL Tools
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          <CardDescription>
            Status tool-urilor necesare pentru operațiunile de backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* pg_dump Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">pg_dump</span>
              <Badge variant={pgDumpAvailable ? "default" : "destructive"}>
                {pgDumpAvailable ? "Disponibil" : "Indisponibil"}
              </Badge>
            </div>
            {pgDumpVersion && (
              <span className="text-sm text-muted-foreground">
                {pgDumpVersion}
              </span>
            )}
          </div>

          {/* psql Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">psql</span>
              <Badge variant={psqlAvailable ? "default" : "destructive"}>
                {psqlAvailable ? "Disponibil" : "Indisponibil"}
              </Badge>
            </div>
            {psqlVersion && (
              <span className="text-sm text-muted-foreground">
                {psqlVersion}
              </span>
            )}
          </div>

          {/* Capabilities */}
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {canCreateBackups ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Creare backup-uri</span>
              </div>
              <div className="flex items-center gap-2">
                {canRestoreBackups ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Restaurare backup-uri</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Instructions (shown when tools are missing) */}
      {!allToolsAvailable && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>PostgreSQL Tools Necesare</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{instructions.description}</p>
            <div className="flex gap-2">
              <Dialog open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Info className="h-4 w-4 mr-2" />
                    Vezi Instrucțiunile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{instructions.title}</DialogTitle>
                    <DialogDescription>
                      Urmează acești pași pentru a instala PostgreSQL client tools pe Windows
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Pași de instalare:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {instructions.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button asChild>
                        <a 
                          href={instructions.downloadUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descarcă PostgreSQL
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Alternativă</AlertTitle>
                      <AlertDescription>
                        {instructions.alternative}
                      </AlertDescription>
                    </Alert>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button asChild variant="outline" size="sm">
                <a 
                  href={instructions.downloadUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descarcă PostgreSQL
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>      )}
    </div>
  )
}
