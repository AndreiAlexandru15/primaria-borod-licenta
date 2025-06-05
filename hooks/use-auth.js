"use client"

/**
 * Hook pentru autentificare custom
 * @fileoverview Înlocuiește useSession de la NextAuth cu implementare custom
 */

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'

// Context pentru autentificare
const AuthContext = createContext({
  user: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
  login: () => {},
  logout: () => {},
  refreshUser: () => {}
})

/**
 * Provider pentru autentificare
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const router = useRouter()

  // Verifică sesiunea la încărcarea componentei
  useEffect(() => {
    checkSession()
  }, [])

  /**
   * Verifică sesiunea curentă
   */
  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.utilizator) {
          setUser({
            id: data.utilizator.id,
            email: data.utilizator.email,
            name: `${data.utilizator.nume} ${data.utilizator.prenume}`,
            nume: data.utilizator.nume,
            prenume: data.utilizator.prenume,
            functie: data.utilizator.functie,
            primaria: data.utilizator.primaria,
            roluri: data.utilizator.roluri,
            permisiuni: data.utilizator.permisiuni,
            avatar: null // Poți adăuga avatar dacă ai
          })
          setStatus('authenticated')
        } else {
          setUser(null)
          setStatus('unauthenticated')
        }
      } else {
        setUser(null)
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('Eroare la verificarea sesiunii:', error)
      setUser(null)
      setStatus('unauthenticated')
    }
  }

  /**
   * Funcție de login
   */
  const login = async (email, parola) => {
    try {
      setStatus('loading')
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, parola })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser({
          id: data.utilizator.id,
          email: data.utilizator.email,
          name: `${data.utilizator.nume} ${data.utilizator.prenume}`,
          nume: data.utilizator.nume,
          prenume: data.utilizator.prenume,
          functie: data.utilizator.functie,
          primaria: data.utilizator.primaria,
          roluri: data.utilizator.roluri,
          permisiuni: data.utilizator.permisiuni,
          avatar: null
        })
        setStatus('authenticated')
        return { success: true }
      } else {
        setStatus('unauthenticated')
        return { success: false, error: data.error || 'Eroare la autentificare' }
      }
    } catch (error) {
      console.error('Eroare la login:', error)
      setStatus('unauthenticated')
      return { success: false, error: 'Eroare de conexiune' }
    }
  }

  /**
   * Funcție de logout
   */
  const logout = async (redirectTo = '/login') => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Eroare la logout:', error)
    } finally {
      setUser(null)
      setStatus('unauthenticated')
      if (redirectTo) {
        router.push(redirectTo)
      }
    }
  }

  /**
   * Reîmprospătează datele utilizatorului
   */
  const refreshUser = () => {
    checkSession()
  }

  const contextValue = {
    user,
    status,
    login,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook pentru utilizarea autentificării
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth trebuie folosit în interiorul AuthProvider')
  }
  return context
}

/**
 * Hook compatibil cu NextAuth pentru tranziția ușoară
 */
export function useSession() {
  const { user, status } = useAuth()
  
  return {
    data: user ? { user } : null,
    status: status === 'authenticated' ? 'authenticated' : 
            status === 'loading' ? 'loading' : 'unauthenticated'
  }
}
