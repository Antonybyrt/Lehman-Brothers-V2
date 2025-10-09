"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react"
import { authService } from "@/services/authService"
import { Toaster } from "react-hot-toast"

export default function ConfirmEmail() {
  const router = useRouter()
  const { token } = router.query
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token && typeof token === 'string') {
      confirmEmail(token)
    }
  }, [token])

  const confirmEmail = async (emailToken: string) => {
    try {
      setLoading(true)
      const result = await authService.confirmEmail(emailToken)
      
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Email confirmation failed')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/5 via-background/3 to-background/8 relative overflow-hidden pt-16">
      {/* Background Spline */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/8" />
      </div>

      <Header />

      <motion.div
        className="relative z-10 w-full max-w-md mx-auto px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border-0 shadow-2xl bg-background/90 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-prestige font-bold text-2xl">L</span>
              </div>
            </motion.div>
            
            <CardTitle className="text-2xl font-prestige font-bold text-foreground/90">
              Email Confirmation
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              {loading ? 'Verifying your email...' : success ? 'Email confirmed successfully!' : 'Email confirmation failed'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Loading State */}
            {loading && (
              <motion.div
                className="flex flex-col items-center space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground text-center">
                  Please wait while we verify your email address...
                </p>
              </motion.div>
            )}

            {/* Success State */}
            {success && !loading && (
              <motion.div
                className="flex flex-col items-center space-y-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CheckCircle className="h-16 w-16 text-green-500" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Email Confirmed!</h3>
                  <p className="text-muted-foreground text-sm">
                    Your email has been successfully verified. You can now sign in to your account.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    onClick={handleBackToLogin}
                    className="flex-1 bg-primary/90 hover:bg-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoHome}
                    className="flex-1 border-2 border-primary/30 hover:bg-primary/5 transition-all duration-300 font-medium bg-background/60"
                  >
                    Go Home
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && !loading && (
              <motion.div
                className="flex flex-col items-center space-y-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <XCircle className="h-16 w-16 text-destructive" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Confirmation Failed</h3>
                  <p className="text-muted-foreground text-sm">
                    {error}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    onClick={handleBackToLogin}
                    className="flex-1 bg-primary/90 hover:bg-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoHome}
                    className="flex-1 border-2 border-primary/30 hover:bg-primary/5 transition-all duration-300 font-medium bg-background/60"
                  >
                    Go Home
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Toaster />
    </div>
  )
}
