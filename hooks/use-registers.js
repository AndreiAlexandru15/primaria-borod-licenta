/**
 * Hook pentru gestionarea registrelor (pentru sidebar)
 * @fileoverview Custom hook pentru fetching registre din toate departamentele
 */

"use client"

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

/**
 * Hook pentru obținerea tuturor registrelor (pentru sidebar)
 */
export function useRegisters() {
  return useQuery({
    queryKey: ['registers', 'sidebar'],
    queryFn: async () => {
      const response = await axios.get('/api/registru?toate=true')
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea registrelor')
      }
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  })
}
