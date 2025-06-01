import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

// Hook pentru obținerea audit logs cu filtrare și paginare
export function useAuditLogs(filters = {}) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      // Adaugă parametrii de filtrare
      if (filters.action) params.append('action', filters.action)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page)
      if (filters.limit) params.append('limit', filters.limit)
      
      const response = await axios.get(`/api/audit-logs?${params.toString()}`)
      return response.data
    },
    keepPreviousData: true,
    staleTime: 30000, // 30 secunde
  })
}

// Hook pentru crearea unui audit log
export function useCreateAuditLog() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (auditData) => {
      const response = await axios.post('/api/audit-logs', auditData)
      return response.data
    },
    onSuccess: () => {
      // Invalidează cache-ul pentru audit logs
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (error) => {
      console.error('Error creating audit log:', error)
      toast.error(error.response?.data?.error || 'Eroare la crearea înregistrării de audit')
    }
  })
}

// Hook customizat pentru logarea automată a acțiunilor
export function useAuditLogger() {
  const createAuditLog = useCreateAuditLog()
  
  const logAction = async (action, entityType, entityId = null, details = null) => {
    try {
      await createAuditLog.mutateAsync({
        action,
        entityType,
        entityId,
        details
      })
    } catch (error) {
      // Nu afișa erori pentru audit logging pentru a nu întrerupe flow-ul aplicației
      console.warn('Failed to log audit action:', error)
    }
  }
  
  return { logAction, isLogging: createAuditLog.isPending }
}

// Constante pentru acțiuni și entități - adaptate la schema existentă
export const AUDIT_ACTIONS = {
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER', 
  DELETE_USER: 'DELETE_USER',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  UPLOAD_FILE: 'UPLOAD_FILE',
  DOWNLOAD_FILE: 'DOWNLOAD_FILE',
  DELETE_FILE: 'DELETE_FILE',
  CREATE_INREGISTRARE: 'CREATE_INREGISTRARE',
  UPDATE_INREGISTRARE: 'UPDATE_INREGISTRARE',
  DELETE_INREGISTRARE: 'DELETE_INREGISTRARE',
  VIEW_DOCUMENT: 'VIEW_DOCUMENT'
}

export const ENTITY_TYPES = {
  USER: 'USER',
  FISIER: 'FISIER',
  INREGISTRARE: 'INREGISTRARE',
  REGISTRU: 'REGISTRU',
  DEPARTMENT: 'DEPARTMENT'
}
