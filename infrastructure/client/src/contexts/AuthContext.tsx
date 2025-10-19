/**
 * Context d'authentification
 * 
 * Centralise les données utilisateur et l'état d'authentification
 * pour éviter les appels répétés à localStorage et authService.
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/services/authService'

interface AuthContextType {
  // Données utilisateur
  userId: string | null
  userRole: string | null
  token: string | null
  isAuthenticated: boolean

  // États
  isLoading: boolean
  error: string | null

  // Actions
  login: (token: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les données d'authentification au montage
  useEffect(() => {
    loadAuthData()
  }, [])

  const loadAuthData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Récupérer le token depuis localStorage
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

      if (!authToken) {
        setIsLoading(false)
        return
      }

      setToken(authToken)
      authService.setAuthToken(authToken)

      // Récupérer les informations utilisateur
      const roleResponse = await authService.getRole()

      if (roleResponse.success && roleResponse.userId) {
        setUserId(roleResponse.userId)
        setUserRole(roleResponse.role || null)
      } else {
        setError('Unable to get user information')
        // Token invalide, le supprimer
        localStorage.removeItem('auth_token')
        setToken(null)
      }
    } catch (err) {
      console.error('Error loading auth data:', err)
      setError('Error loading user information')
      // En cas d'erreur, nettoyer l'authentification
      localStorage.removeItem('auth_token')
      setToken(null)
      setUserId(null)
      setUserRole(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (newToken: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Stocker le token
      localStorage.setItem('auth_token', newToken)
      setToken(newToken)
      authService.setAuthToken(newToken)

      // Récupérer les informations utilisateur
      const roleResponse = await authService.getRole()

      if (roleResponse.success && roleResponse.userId) {
        setUserId(roleResponse.userId)
        setUserRole(roleResponse.role || null)
      } else {
        throw new Error('Unable to get user information')
      }
    } catch (err) {
      console.error('Error during login:', err)
      setError('Login failed')
      logout() // Nettoyer en cas d'erreur
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Nettoyer toutes les données
    localStorage.removeItem('auth_token')
    setToken(null)
    setUserId(null)
    setUserRole(null)
    setError(null)
  }

  const refreshAuth = async () => {
    await loadAuthData()
  }

  const value: AuthContextType = {
    userId,
    userRole,
    token,
    isAuthenticated: !!token && !!userId,
    isLoading,
    error,
    login,
    logout,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

