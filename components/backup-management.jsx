"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import PostgreSQLStatus from "./postgresql-status"
import { 
  Database, 
  Download, 
  Trash2, 
  Upload, 
  RefreshCw, 
  AlertTriangle,
  Plus,
  Server,
  HardDrive
} from 'lucide-react'

export default function BackupManagement() {
  const [isCreateBackupDialogOpen, setIsCreateBackupDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState(null)
  const queryClient = useQueryClient()

  // Query pentru listarea backup-urilor
  const { 
    data: backups = [], 
    isLoading: isLoadingBackups, 
    error: backupsError 
  } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await axios.get('/api/backup')
      return response.data.data || []
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Mutation pentru crearea backup-ului
  const createBackupMutation = useMutation({
    mutationFn: async (type = 'manual') => {
      const response = await axios.post('/api/backup', { type })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success(data.message || 'Backup-ul a fost creat cu succes!')
      setIsCreateBackupDialogOpen(false)
    },    onError: (error) => {
      console.error('Error creating backup:', error)
      const errorData = error.response?.data
      
      if (errorData?.instructions) {
        // Afișează instrucțiuni pentru instalarea PostgreSQL
        toast.error(
          `${errorData.error}: ${errorData.message}`,
          {
            description: 'Vezi instrucțiunile în consolă pentru instalare',
            duration: 8000,
          }
        )
        console.log('=== INSTRUCȚIUNI INSTALARE POSTGRESQL ===')
        console.log(errorData.message)
        console.log('\nPașii pentru Windows:')
        errorData.instructions.windows.forEach((step, index) => {
          console.log(`${index + 1}. ${step}`)
        })
        console.log(`\nAlternativă: ${errorData.instructions.alternative}`)
        console.log('==========================================')
      } else {
        toast.error(errorData?.error || 'Eroare la crearea backup-ului')
      }
    }
  })

  // Mutation pentru restaurarea backup-ului
  const restoreBackupMutation = useMutation({
    mutationFn: async (filename) => {
      const response = await axios.post('/api/backup/restore', { filename })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success(data.message || 'Baza de date a fost restaurată cu succes!')
      setIsRestoreDialogOpen(false)
      setSelectedBackupForRestore(null)
    },    onError: (error) => {
      console.error('Error restoring backup:', error)
      const errorData = error.response?.data
      
      if (errorData?.instructions) {
        // Afișează instrucțiuni pentru instalarea PostgreSQL
        toast.error(
          `${errorData.error}: ${errorData.message}`,
          {
            description: 'Vezi instrucțiunile în consolă pentru instalare',
            duration: 8000,
          }
        )
        console.log('=== INSTRUCȚIUNI INSTALARE POSTGRESQL ===')
        console.log(errorData.message)
        console.log('\nPașii pentru Windows:')
        errorData.instructions.windows.forEach((step, index) => {
          console.log(`${index + 1}. ${step}`)
        })
        console.log(`\nAlternativă: ${errorData.instructions.alternative}`)
        console.log('==========================================')
      } else {
        toast.error(errorData?.error || 'Eroare la restaurarea backup-ului')
      }
    }
  })

  // Mutation pentru ștergerea backup-ului
  const deleteBackupMutation = useMutation({
    mutationFn: async (filename) => {
      const response = await axios.delete('/api/backup', { 
        data: { filename } 
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success(data.message || 'Backup-ul a fost șters cu succes!')
    },
    onError: (error) => {
      console.error('Error deleting backup:', error)
      toast.error(error.response?.data?.error || 'Eroare la ștergerea backup-ului')
    }
  })

  const handleCreateBackup = () => {
    createBackupMutation.mutate('manual')
  }

  const handleDownloadBackup = (filename) => {
    const downloadUrl = `/api/backup/download/${filename}`
    window.open(downloadUrl, '_blank')
  }

  const handleRestoreBackup = (backup) => {
    setSelectedBackupForRestore(backup)
    setIsRestoreDialogOpen(true)
  }

  const confirmRestore = () => {
    if (selectedBackupForRestore) {
      restoreBackupMutation.mutate(selectedBackupForRestore.name)
    }
  }

  const handleDeleteBackup = (filename) => {
    deleteBackupMutation.mutate(filename)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (backupsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eroare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nu s-au putut încărca backup-urile: {backupsError.message}
          </p>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-6">
      {/* PostgreSQL Status */}
      <PostgreSQLStatus />
      
      {/* Header cu statistici */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Backup-uri
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dimensiune Totală
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backups.reduce((total, backup) => {
                const sizeInBytes = backup.sizeBytes || 0
                return total + sizeInBytes
              }, 0) > 0 ? 
                formatFileSize(backups.reduce((total, backup) => total + (backup.sizeBytes || 0), 0)) :
                '0 B'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ultimul Backup
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {backups.length > 0 ? formatDate(backups[0].created) : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Managementul Backup-urilor
          </CardTitle>
          <CardDescription>
            Creează, restaurează și gestionează backup-urile bazei de date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Dialog open={isCreateBackupDialogOpen} onOpenChange={setIsCreateBackupDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Creează Backup Manual
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Creează Backup Manual</DialogTitle>
                  <DialogDescription>
                    Aceasta va crea un backup complet al bazei de date curente.
                    Procesul poate dura câteva minute în funcție de dimensiunea bazei de date.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateBackupDialogOpen(false)}
                  >
                    Anulează
                  </Button>
                  <Button 
                    onClick={handleCreateBackup}
                    disabled={createBackupMutation.isPending}
                  >
                    {createBackupMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Se creează...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Creează Backup
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['backups'] })}
              disabled={isLoadingBackups}
            >
              {isLoadingBackups ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualizează Lista
            </Button>
          </div>

          {/* Tabela cu backup-urile */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume Fișier</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Dimensiune</TableHead>
                  <TableHead>Data Creării</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingBackups ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Se încarcă backup-urile...
                    </TableCell>
                  </TableRow>
                ) : backups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Database className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Nu există backup-uri create</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">
                        {backup.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={backup.type === 'Manual' ? 'default' : 'secondary'}>
                          {backup.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>{formatDate(backup.created)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600">
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Șterge Backup</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ești sigur că vrei să ștergi backup-ul "{backup.name}"?
                                  Această acțiune nu poate fi anulată.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulează</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteBackup(backup.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Șterge
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pentru confirmare restaurare */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmă Restaurarea
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Ești sigur că vrei să restaurezi baza de date din backup-ul "{selectedBackupForRestore?.name}"?
              </p>
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ ATENȚIE: Această operațiune va înlocui complet baza de date curentă cu datele din backup.
                Toate modificările efectuate după data backup-ului vor fi pierdute!
              </p>
              <p className="text-sm text-muted-foreground">
                Va fi creat automat un backup de siguranță înainte de restaurare.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              disabled={restoreBackupMutation.isPending}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {restoreBackupMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Se restaurează...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Confirmă Restaurarea
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Helper function pentru formatarea dimensiunii fișierului
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
