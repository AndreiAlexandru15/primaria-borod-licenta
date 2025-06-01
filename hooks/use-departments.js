/**
 * Hook pentru gestionarea departamentelor
 * Folosește React Query pentru gestionarea state-ului departamentelor
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const DEPARTMENTS_QUERY_KEY = ['departments']

/**
 * Hook pentru obținerea listei de departamente
 */
export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch('/api/departamente', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Eroare la încărcarea departamentelor')
      }

      const data = await response.json()
      return data.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook pentru crearea unui departament nou
 */
export function useCreateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (departmentData) => {
      const response = await fetch('/api/departamente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Eroare la crearea departamentului')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch departments
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY })
    },
  })
}

/**
 * Hook pentru actualizarea unui departament
 */
export function useUpdateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...departmentData }) => {
      const response = await fetch(`/api/departamente/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Eroare la actualizarea departamentului')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch departments
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY })
    },
  })
}

/**
 * Hook pentru ștergerea unui departament
 */
export function useDeleteDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (departmentId) => {
      const response = await fetch(`/api/departamente?id=${departmentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Eroare la ștergerea departamentului')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch departments
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY })
    },
  })
}
