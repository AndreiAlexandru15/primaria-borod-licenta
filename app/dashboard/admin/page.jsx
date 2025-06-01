"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Plus, Users, Shield, Key, FileText, FolderOpen, ClipboardList, Database, Upload, Edit, Trash2, Eye, Loader2, Search } from "lucide-react"
import AddUserDialog from "@/components/AddUserDialog"
import AddRoleDialog from "@/components/adauga-rol-modal"
import AddPermissionDialog from "@/components/adauga-permisiune-modal"
import AdaugaTipDocumentModal from "@/components/adauga-tip-document-modal"
import EditeazaTipDocumentModal from "@/components/editeaza-tip-document-modal"
import UsersTable from "@/components/UsersTable"
import RolesTable from "@/components/RolesTable"
import PermissionsTable from "@/components/PermissionsTable"
import TipuriDocumenteTable from "@/components/TipuriDocumenteTable"
import { useUsers, useCreateUser, useDeleteUser } from "@/hooks/use-users"
import { useDepartments } from "@/hooks/use-departments"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from "axios"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function AdminPage() {  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("users")
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false)
  const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState(false)
  const [isCreateTipDocumentDialogOpen, setIsCreateTipDocumentDialogOpen] = useState(false)
  const [isEditTipDocumentDialogOpen, setIsEditTipDocumentDialogOpen] = useState(false)
  const [editingTipDocument, setEditingTipDocument] = useState(null)
  const [newUserData, setNewUserData] = useState({
    nume: "",
    prenume: "",
    email: "",
    functie: "",
    telefon: "",
    parola: "",
    departamentId: ""
  })

  const queryClient = useQueryClient()

  // TanStack Query hooks
  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useUsers()
  const { data: departments = [], isLoading: isLoadingDepartments } = useDepartments()
  const createUserMutation = useCreateUser()
  const deleteUserMutation = useDeleteUser()

  // Query pentru roluri
  const {
    data: rolesData = [],
    isLoading: isLoadingRoles,
    error: rolesError
  } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await axios.get("/api/roluri")
      return res.data.data || []
    }
  })
  // Mutation pentru crearea rolurilor
  const createRoleMutation = useMutation({
    mutationFn: async (roleData) => {
      const response = await axios.post("/api/roluri", roleData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Rolul a fost creat cu succes!")
      setIsCreateRoleDialogOpen(false)
    },
    onError: (error) => {
      console.error("Error creating role:", error)
      toast.error(error.response?.data?.message || "Eroare la crearea rolului")
    }
  })

  // Query pentru permisiuni
  const {
    data: permissionsData = [],
    isLoading: isLoadingPermissions,
    error: permissionsError
  } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await axios.get("/api/permisiuni")
      return res.data.data || []
    }
  })

  // Mutation pentru crearea permisiunilor
  const createPermissionMutation = useMutation({
    mutationFn: async (permissionData) => {
      const response = await axios.post("/api/permisiuni", permissionData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] })
      toast.success("Permisiunea a fost creată cu succes!")
      setIsCreatePermissionDialogOpen(false)
    },
    onError: (error) => {
      console.error("Error creating permission:", error)
      toast.error(error.response?.data?.message || "Eroare la crearea permisiunii")
    }
  })

  // Mutation pentru actualizarea permisiunilor
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put("/api/permisiuni", { id, ...data })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] })
      toast.success("Permisiunea a fost actualizată cu succes!")
    },
    onError: (error) => {
      console.error("Error updating permission:", error)
      toast.error(error.response?.data?.message || "Eroare la actualizarea permisiunii")
    }
  })
  // Mutation pentru ștergerea permisiunilor
  const deletePermissionMutation = useMutation({
    mutationFn: async (permissionId) => {
      const response = await axios.delete("/api/permisiuni", {
        data: { id: permissionId }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] })
      toast.success("Permisiunea a fost ștearsă cu succes!")
    },
    onError: (error) => {
      console.error("Error deleting permission:", error)
      toast.error(error.response?.data?.message || "Eroare la ștergerea permisiunii")
    }
  })
  // Query pentru registre (necesare pentru tipuri documente)
  const {
    data: registreData = [],
    isLoading: isLoadingRegistre
  } = useQuery({
    queryKey: ["registre"],
    queryFn: async () => {
      const res = await axios.get("/api/registru?toate=true")
      return res.data.data || []
    }
  })

  // Query pentru categorii documente 
  const {
    data: categoriiData = [],
    isLoading: isLoadingCategorii
  } = useQuery({
    queryKey: ["categorii-document"],
    queryFn: async () => {
      const res = await axios.get("/api/categorii-document")
      return res.data.data || []
    }
  })
  // Query pentru tipuri documente
  const {
    data: tipuriDocumenteData = [],
    isLoading: isLoadingTipuriDocumente,
    error: tipuriDocumenteError
  } = useQuery({
    queryKey: ["tipuri-documente"],
    queryFn: async () => {
      const res = await axios.get("/api/tipuri-documente?toate=true")
      return res.data.data || []
    }
  })

  // Mutation pentru crearea tipurilor de documente
  const createTipDocumentMutation = useMutation({
    mutationFn: async (tipDocumentData) => {
      const response = await axios.post("/api/tipuri-documente", tipDocumentData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipuri-documente"] })
      toast.success("Tipul de document a fost creat cu succes!")
      setIsCreateTipDocumentDialogOpen(false)
    },
    onError: (error) => {
      console.error("Error creating tip document:", error)
      toast.error(error.response?.data?.error || "Eroare la crearea tipului de document")
    }
  })

  // Mutation pentru actualizarea tipurilor de documente
  const updateTipDocumentMutation = useMutation({
    mutationFn: async (tipDocumentData) => {
      const { id, ...updateData } = tipDocumentData
      const response = await axios.put("/api/tipuri-documente", { id, ...updateData })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipuri-documente"] })
      toast.success("Tipul de document a fost actualizat cu succes!")
      setIsEditTipDocumentDialogOpen(false)
      setEditingTipDocument(null)
    },
    onError: (error) => {
      console.error("Error updating tip document:", error)
      toast.error(error.response?.data?.error || "Eroare la actualizarea tipului de document")
    }
  })

  // Mutation pentru ștergerea tipurilor de documente
  const deleteTipDocumentMutation = useMutation({
    mutationFn: async (tipDocumentId) => {
      const response = await axios.delete(`/api/tipuri-documente/${tipDocumentId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipuri-documente"] })
      toast.success("Tipul de document a fost șters cu succes!")
    },
    onError: (error) => {
      console.error("Error deleting tip document:", error)
      toast.error(error.response?.data?.error || "Eroare la ștergerea tipului de document")
    }
  })

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users
    return users.filter(user =>
      user.nume?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenume?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.functie?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const handleCreateUser = async () => {
    try {
      await createUserMutation.mutateAsync(newUserData)
      setIsCreateUserDialogOpen(false)
      setNewUserData({ nume: "", prenume: "", email: "", functie: "", telefon: "", parola: "", departamentId: "" })
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }
  const handleCreateRole = async (roleData) => {
    try {
      await createRoleMutation.mutateAsync(roleData)
    } catch (error) {
      console.error('Error creating role:', error)
    }
  }

  const handleCreatePermission = async (permissionData) => {
    try {
      await createPermissionMutation.mutateAsync(permissionData)
    } catch (error) {
      console.error('Error creating permission:', error)
    }
  }

  const handleUpdatePermission = async (id, data) => {
    try {
      await updatePermissionMutation.mutateAsync({ id, data })
    } catch (error) {
      console.error('Error updating permission:', error)
    }
  }
  const handleDeletePermission = async (permissionId) => {
    if (window.confirm('Ești sigur că vrei să ștergi această permisiune?')) {
      try {
        await deletePermissionMutation.mutateAsync(permissionId)
      } catch (error) {
        console.error('Error deleting permission:', error)
      }
    }
  }

  // Handler functions pentru TipDocument
  const handleCreateTipDocument = async (tipDocumentData) => {
    try {
      await createTipDocumentMutation.mutateAsync(tipDocumentData)
    } catch (error) {
      console.error('Error creating tip document:', error)
    }
  }

  const handleEditTipDocument = (tipDocument) => {
    setEditingTipDocument(tipDocument)
    setIsEditTipDocumentDialogOpen(true)
  }

  const handleUpdateTipDocument = async (tipDocumentData) => {
    try {
      await updateTipDocumentMutation.mutateAsync(tipDocumentData)
    } catch (error) {
      console.error('Error updating tip document:', error)
    }
  }

  const handleDeleteTipDocument = async (tipDocumentId) => {
    if (window.confirm('Ești sigur că vrei să ștergi acest tip de document?')) {
      try {
        await deleteTipDocumentMutation.mutateAsync(tipDocumentId)
      } catch (error) {
        console.error('Error deleting tip document:', error)
      }
    }
  }
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Ești sigur că vrei să ștergi acest utilizator?')) {
      try {
        await deleteUserMutation.mutateAsync(userId)
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }
  
  const roles = [
    { id: 1, name: "Admin", description: "Acces complet la sistem", permissions: 15, users: 2 },
    { id: 2, name: "Manager", description: "Gestionare documente și utilizatori", permissions: 8, users: 5 },
    { id: 3, name: "User", description: "Acces de bază la documente", permissions: 3, users: 25 }
  ]

  const folderCategories = [
    { id: 1, name: "Financiar", description: "Documente financiare", parent: null, documentsCount: 150 },
    { id: 2, name: "HR", description: "Resurse umane", parent: null, documentsCount: 89 },
    { id: 3, name: "Contracte", description: "Contracte cu clienții", parent: 1, documentsCount: 45 }
  ]

  const auditLogs = [
    { id: 1, user: "John Doe", action: "CREATE_USER", resource: "User", timestamp: "2025-06-01 10:30", ip: "192.168.1.100" },
    { id: 2, user: "Jane Smith", action: "DELETE_DOCUMENT", resource: "Document #123", timestamp: "2025-06-01 09:15", ip: "192.168.1.101" },
    { id: 3, user: "Bob Wilson", action: "UPDATE_ROLE", resource: "Role Manager", timestamp: "2025-05-31 16:45", ip: "192.168.1.102" }
  ]

  const backups = [
    { id: 1, name: "backup_2025_06_01.sql", size: "2.5 GB", created: "2025-06-01 02:00", type: "Automatic", status: "Completed" },
    { id: 2, name: "backup_2025_05_31.sql", size: "2.4 GB", created: "2025-05-31 02:00", type: "Automatic", status: "Completed" },    { id: 3, name: "manual_backup_2025_05_30.sql", size: "2.3 GB", created: "2025-05-30 14:30", type: "Manual", status: "Completed" }
  ]
  
  const stats = [
    { title: "Total Utilizatori", value: users.length.toString(), icon: Users, color: "text-blue-600" },
    { title: "Roluri Active", value: rolesData.length.toString(), icon: Shield, color: "text-green-600" },
    { title: "Permisiuni", value: permissionsData.length.toString(), icon: Key, color: "text-purple-600" },
    { title: "Tipuri Documente", value: tipuriDocumenteData.length.toString(), icon: FileText, color: "text-orange-600" }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Panou de Administrare</h1>
          <p className="text-muted-foreground">Gestionează utilizatorii, rolurile și permisiunile sistemului</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="users">Utilizatori</TabsTrigger>
          <TabsTrigger value="roles">Roluri</TabsTrigger>
          <TabsTrigger value="permissions">Permisiuni</TabsTrigger>
          <TabsTrigger value="documents">Tipuri Doc.</TabsTrigger>
          <TabsTrigger value="folders">Categorii</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="backup">Back-up</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestionare Utilizatori
              </CardTitle>
              <CardDescription>Administrează conturile de utilizator și accesul acestora</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                users={filteredUsers}
                isLoading={isLoadingUsers}
                error={usersError}
                handleDeleteUser={handleDeleteUser}
                deleteUserMutation={deleteUserMutation}
                AddUserDialog={
                  <AddUserDialog
                    open={isCreateUserDialogOpen}
                    onOpenChange={setIsCreateUserDialogOpen}
                    newUserData={newUserData}
                    setNewUserData={setNewUserData}
                    handleCreateUser={handleCreateUser}
                    createUserMutation={createUserMutation}
                    departments={departments}
                    isLoadingDepartments={isLoadingDepartments}
                  />
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestionare Roluri
              </CardTitle>
              <CardDescription>Definește și gestionează rolurile utilizatorilor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <AddRoleDialog
                  open={isCreateRoleDialogOpen}
                  onOpenChange={setIsCreateRoleDialogOpen}
                  onSubmit={handleCreateRole}
                  isLoading={createRoleMutation.isPending}
                />
              </div>
              <RolesTable
                roles={rolesData}
                isLoading={isLoadingRoles}
                error={rolesError?.message}
              />
            </CardContent>
          </Card>
        </TabsContent>        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Gestionare Permisiuni
              </CardTitle>
              <CardDescription>Controlează accesul la funcționalitățile sistemului</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <AddPermissionDialog
                  open={isCreatePermissionDialogOpen}
                  onOpenChange={setIsCreatePermissionDialogOpen}
                  onSubmit={handleCreatePermission}
                  isLoading={createPermissionMutation.isPending}
                />
              </div>
              <PermissionsTable
                permissions={permissionsData}
                isLoading={isLoadingPermissions}
                error={permissionsError?.message}
                onUpdate={handleUpdatePermission}
                onDelete={handleDeletePermission}
                updateMutation={updatePermissionMutation}
                deleteMutation={deletePermissionMutation}
              />
            </CardContent>
          </Card>
        </TabsContent>        {/* Document Types Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tipuri de Documente
              </CardTitle>
              <CardDescription>
                Gestionează tipurile de documente din registre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <AdaugaTipDocumentModal
                  open={isCreateTipDocumentDialogOpen}
                  onOpenChange={setIsCreateTipDocumentDialogOpen}
                  onSubmit={handleCreateTipDocument}
                  isLoading={createTipDocumentMutation.isPending}
                  registre={registreData}
                  categorii={categoriiData}
                />
              </div>
              <TipuriDocumenteTable
                tipuriDocumente={tipuriDocumenteData}
                isLoading={isLoadingTipuriDocumente}
                error={tipuriDocumenteError?.message}
                onEdit={handleEditTipDocument}
                onDelete={handleDeleteTipDocument}
                isDeleting={deleteTipDocumentMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Folder Categories Tab */}
        <TabsContent value="folders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Categorii Dosare
              </CardTitle>
              <CardDescription>Organizează structura dosarelor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă Categorie
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume</TableHead>
                    <TableHead>Descriere</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Documente</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folderCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>{category.parent || "-"}</TableCell>
                      <TableCell>{category.documentsCount}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Jurnal de Audit
              </CardTitle>
              <CardDescription>Monitorizează activitățile utilizatorilor</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizator</TableHead>
                    <TableHead>Acțiune</TableHead>
                    <TableHead>Resursă</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell>{log.ip}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestionare Back-up
              </CardTitle>
              <CardDescription>Administrează copiile de siguranță ale sistemului</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Backup Manual
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Restaurează
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume Fișier</TableHead>
                    <TableHead>Dimensiune</TableHead>
                    <TableHead>Creat</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.name}</TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>{backup.created}</TableCell>
                      <TableCell>
                        <Badge variant={backup.type === "Automatic" ? "default" : "secondary"}>
                          {backup.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{backup.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>        </TabsContent>
      </Tabs>

      {/* Edit TipDocument Modal */}
      <EditeazaTipDocumentModal
        open={isEditTipDocumentDialogOpen}
        onOpenChange={setIsEditTipDocumentDialogOpen}
        onSubmit={handleUpdateTipDocument}
        isLoading={updateTipDocumentMutation.isPending}
        tipDocument={editingTipDocument}
        registre={registreData}
        categorii={categoriiData}
      />
    </div>
  )
}