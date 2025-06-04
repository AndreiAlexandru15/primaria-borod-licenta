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
import AdaugaCategorieDocumentModal from "@/components/adauga-categorie-modal"
import EditeazaCategorieDocumentModal from "@/components/editeaza-categorie-modal"
import BackupManagement from "@/components/backup-management"
import UsersTable from "@/components/UsersTable"
import RolesTable from "@/components/RolesTable"
import PermissionsTable from "@/components/PermissionsTable"
import TipuriDocumenteTable from "@/components/TipuriDocumenteTable"
import CategoriiDocumenteTable from "@/components/CategoriiDocumenteTable"
import AuditLogsTable from "@/components/AuditLogsTable"
import EditeazaUtilizatorModal from "@/components/editeaza-utilizator-modal"
import EditRoleDialog from "@/components/editeaza-rol-modal"
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users"
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "@/hooks/use-roles"
import { useDepartments } from "@/hooks/use-departments"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from "axios"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("users")
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false)
  const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState(false)
  const [isCreateTipDocumentDialogOpen, setIsCreateTipDocumentDialogOpen] = useState(false)
  const [isEditTipDocumentDialogOpen, setIsEditTipDocumentDialogOpen] = useState(false)
  const [isCreateCategorieDialogOpen, setIsCreateCategorieDialogOpen] = useState(false)
  const [isEditCategorieDialogOpen, setIsEditCategorieDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [editingTipDocument, setEditingTipDocument] = useState(null)
  const [editingCategorie, setEditingCategorie] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
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

  // Role management hooks
  const { data: rolesData = [], isLoading: isLoadingRoles, error: rolesError } = useRoles()
  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()

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
    isLoading: isLoadingCategorii,
    error: categoriiError
  } = useQuery({
    queryKey: ["categorii-document"],
    queryFn: async () => {
      const res = await axios.get("/api/categorii-document")
      return res.data.data || []
    }
  })

  // Query pentru confidentialitati (necesare pentru categorii documente)
  const {
    data: confidentialitatiData = [],
    isLoading: isLoadingConfidentialitati
  } = useQuery({
    queryKey: ["confidentialitati-document"],
    queryFn: async () => {
      const res = await axios.get("/api/confidentialitati-document?activ=true")
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

  // Mutations pentru categorii documente
  const createCategorieMutation = useMutation({
    mutationFn: async (categorieData) => {
      const response = await axios.post("/api/categorii-document", categorieData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorii-document"] })
      toast.success("Categoria a fost creată cu succes!")
      setIsCreateCategorieDialogOpen(false)
    },
    onError: (error) => {
      console.error("Error creating categorie:", error)
      toast.error(error.response?.data?.error || "Eroare la crearea categoriei")
    }
  })

  const updateCategorieMutation = useMutation({
    mutationFn: async (categorieData) => {
      const { id, ...updateData } = categorieData
      const response = await axios.put("/api/categorii-document", { id, ...updateData })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorii-document"] })
      toast.success("Categoria a fost actualizată cu succes!")
      setIsEditCategorieDialogOpen(false)
      setEditingCategorie(null)
    },
    onError: (error) => {
      console.error("Error updating categorie:", error)
      toast.error(error.response?.data?.error || "Eroare la actualizarea categoriei")
    }
  })

  const deleteCategorieMutation = useMutation({
    mutationFn: async (categorieId) => {
      const response = await axios.delete(`/api/categorii-document?id=${categorieId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorii-document"] })
      toast.success("Categoria a fost ștearsă cu succes!")
    },
    onError: (error) => {
      console.error("Error deleting categorie:", error)
      toast.error(error.response?.data?.error || "Eroare la ștergerea categoriei")
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
      // Debug: Log the data being sent
      console.log('Creating user with data:', newUserData)
      console.log('Required fields check:', {
        nume: !!newUserData.nume,
        prenume: !!newUserData.prenume,
        email: !!newUserData.email,
        parola: !!newUserData.parola
      })
      
      await createUserMutation.mutateAsync(newUserData)
      setIsCreateUserDialogOpen(false)
      setNewUserData({ nume: "", prenume: "", email: "", functie: "", telefon: "", parola: "", departamentId: "" })
    } catch (error) {
      console.error('Error creating user:', error)
      console.error('Error response:', error.response?.data)
    }
  }

  const handleCreateRole = async (roleData) => {
    try {
      await createRoleMutation.mutateAsync(roleData)
      toast.success("Rolul a fost creat cu succes!")
      setIsCreateRoleDialogOpen(false)
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error(error.response?.data?.message || "Eroare la crearea rolului")
    }
  }

  const handleEditRole = (role) => {
    setEditingRole(role)
    setIsEditRoleDialogOpen(true)
  }
  const handleUpdateRole = async (id, data) => {
    try {
      await updateRoleMutation.mutateAsync({ id, data })
      toast.success("Rolul a fost actualizat cu succes!")
      setIsEditRoleDialogOpen(false)
      setEditingRole(null)
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(error.response?.data?.message || "Eroare la actualizarea rolului")
    }
  }

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Ești sigur că vrei să ștergi acest rol?')) {
      try {
        await deleteRoleMutation.mutateAsync(roleId)
        toast.success("Rolul a fost șters cu succes!")
      } catch (error) {
        console.error('Error deleting role:', error)
        toast.error(error.response?.data?.message || "Eroare la ștergerea rolului")
      }
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

  // Handler functions pentru Categorii
  const handleCreateCategorie = async (categorieData) => {
    try {
      await createCategorieMutation.mutateAsync(categorieData)
    } catch (error) {
      console.error('Error creating categorie:', error)
    }
  }

  const handleEditCategorie = (categorie) => {
    setEditingCategorie(categorie)
    setIsEditCategorieDialogOpen(true)
  }

  const handleUpdateCategorie = async (categorieData) => {
    try {
      await updateCategorieMutation.mutateAsync(categorieData)
    } catch (error) {
      console.error('Error updating categorie:', error)
    }
  }

  const handleDeleteCategorie = async (categorieId) => {
    if (window.confirm('Ești sigur că vrei să ștergi această categorie?')) {
      try {
        await deleteCategorieMutation.mutateAsync(categorieId)
      } catch (error) {
        console.error('Error deleting categorie:', error)
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

  // Handler pentru editarea utilizatorului  const handleEditUser = (user) => {
      const handleEditUser = (user) => {
    setEditingUser(user)
    setIsEditUserDialogOpen(true)
  }

  // Mutation pentru editarea utilizatorului
  const updateUserMutation = useUpdateUser()

  const backups = [
    { id: 1, name: "backup_2025_06_01.sql", size: "2.5 GB", created: "2025-06-01 02:00", type: "Automatic", status: "Completed" },
    { id: 2, name: "backup_2025_05_31.sql", size: "2.4 GB", created: "2025-05-31 02:00", type: "Automatic", status: "Completed" },
    { id: 3, name: "manual_backup_2025_05_30.sql", size: "2.3 GB", created: "2025-05-30 14:30", type: "Manual", status: "Completed" }
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
          <TabsTrigger value="categories">Categorii Doc.</TabsTrigger>
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
                handleEditUser={handleEditUser}
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
              </div>              <RolesTable
                roles={rolesData}
                isLoading={isLoadingRoles}
                error={rolesError?.message}
                handleEditRole={handleEditRole}
                handleDeleteRole={handleDeleteRole}
                deleteRoleMutation={deleteRoleMutation}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
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
        </TabsContent>

        {/* Document Types Tab */}
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

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Categorii de Documente
              </CardTitle>
              <CardDescription>Gestionează categoriile pentru organizarea documentelor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <AdaugaCategorieDocumentModal
                  open={isCreateCategorieDialogOpen}
                  onOpenChange={setIsCreateCategorieDialogOpen}
                  onSubmit={handleCreateCategorie}
                  isLoading={createCategorieMutation.isPending}
                  confidentialitati={confidentialitatiData}
                  isLoadingConfidentialitati={isLoadingConfidentialitati}
                />
              </div>
              <CategoriiDocumenteTable
                categorii={categoriiData}
                isLoading={isLoadingCategorii}
                error={categoriiError?.message}
                onEdit={handleEditCategorie}
                onDelete={handleDeleteCategorie}
                isDeleting={deleteCategorieMutation.isPending}
              />
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
              <CardDescription>Monitorizează activitățile utilizatorilor în sistem</CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogsTable />
            </CardContent>
          </Card>
        </TabsContent>        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-4">
          <BackupManagement />
        </TabsContent>
      </Tabs>      {/* Edit User Modal */}
      <EditeazaUtilizatorModal
        utilizator={editingUser}
        isOpen={isEditUserDialogOpen}
        onClose={() => {
          setIsEditUserDialogOpen(false)
          setEditingUser(null)
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['users'] })
          setIsEditUserDialogOpen(false)
          setEditingUser(null)
        }}
      />      {/* Edit Role Modal */}
      <EditRoleDialog
        open={isEditRoleDialogOpen}
        onOpenChange={setIsEditRoleDialogOpen}
        onSubmit={(data) => handleUpdateRole(editingRole?.id, data)}
        isLoading={updateRoleMutation.isPending}
        role={editingRole}
      />

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

      {/* Edit Categorie Modal */}
      <EditeazaCategorieDocumentModal
        open={isEditCategorieDialogOpen}
        onOpenChange={setIsEditCategorieDialogOpen}
        onSubmit={handleUpdateCategorie}
        isLoading={updateCategorieMutation.isPending}
        categorie={editingCategorie}
        confidentialitati={confidentialitatiData}
        isLoadingConfidentialitati={isLoadingConfidentialitati}
      />
    </div>
  )
}