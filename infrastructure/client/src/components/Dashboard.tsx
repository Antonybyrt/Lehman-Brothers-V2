"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/router"
import { Header } from "@/components/Header"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { authService } from "@/services/authService"
import ClientDashboard from "./dashboards/ClientDashboard"
import AdvisorDashboard from "./dashboards/AdvisorDashboard"
import DirectorDashboard from "./dashboards/DirectorDashboard"

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)

  const checkAuthAndRole = useCallback(async () => {
    try {
      setLoading(true)

      // Check if user has token
      const token = authService.getStoredToken()
      if (!token) {
        router.push('/login')
        return
      }

      // Set token for API calls
      authService.setAuthToken(token)

      // Get user role
      const result = await authService.getRole()

      if (result.success && result.role) {
        setRole(result.role)
      } else {
        if (result.error?.includes('token') || result.error?.includes('Authentication')) {
          authService.removeAuthToken()
          router.push('/login')
        }
      }
    } catch {
      authService.removeAuthToken()
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuthAndRole()
  }, [checkAuthAndRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/5 via-background/3 to-background/8 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/8" />
        </div>

        <Header />

        <motion.div
          className="relative z-10 flex flex-col items-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </motion.div>
      </div>
    )
  }

  // Render appropriate dashboard based on role
  if (!role) {
    return null
  }

  switch (role) {
    case 'CLIENT':
      return <ClientDashboard />
    case 'ADVISOR':
      return <AdvisorDashboard />
    case 'DIRECTOR':
      return <DirectorDashboard />
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/5 via-background/3 to-background/8 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/8" />
          </div>

          <Header />

          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-destructive mb-4">Unknown user role: {role}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
            >
              Back to Login
            </button>
          </motion.div>
        </div>
      )
  }
}
