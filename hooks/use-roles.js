/**
 * Hook pentru gestionarea rolurilor
 * Folosește React Query pentru gestionarea state-ului rolurilor
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

const ROLES_QUERY_KEY = ['roles']

/**
 * Hook pentru obținerea listei de roluri
 */
export function useRoles() {
  return useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get('/roluri')
      return response.data.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook pentru crearea unui rol nou
 */
export function useCreateRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (roleData) => {
      const response = await api.post('/roluri', roleData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
    },
  })
}

/**
 * Hook pentru actualizarea unui rol
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/roluri/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
    },
  })
}

/**
 * Hook pentru ștergerea unui rol
 */
export function useDeleteRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/roluri/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
    },
  })
}
