"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react"
import { authService, RegisterRequest } from "@/services/authService"
import toast from "react-hot-toast"

interface RegisterFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function RegisterForm({ onSuccess, onBack }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [registerData, setRegisterData] = useState<RegisterRequest>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await authService.register(registerData)
      
      if (result.success) {
        // Reset form
        setRegisterData({
          firstName: '',
          lastName: '',
          email: '',
          password: ''
        })
        
        // Show success toast
        toast.success(
          <div className="flex flex-col">
            <div className="font-semibold text-green-800">Account created successfully!</div>
            <div className="text-sm text-green-700 mt-1">
              Please check your email to confirm your account before signing in.
            </div>
          </div>,
          {
            duration: 3000,
            position: 'top-right',
            style: {
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px',
            },
          }
        )
        
        // Optionally redirect after success
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/5 via-background/3 to-background/8 relative overflow-hidden pt-16">
      {/* Background Spline */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/8" />
      </div>

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
              Create Account
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Join Lehman Brothers Heritage - Create your client account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <motion.div
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {success}
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground/80">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      className="pl-10 bg-background/60 border-border/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-foreground/80">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      className="pl-10 bg-background/60 border-border/50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="pl-10 bg-background/60 border-border/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="pl-10 pr-10 bg-background/60 border-border/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary/90 hover:bg-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center space-y-3">
              <button
                onClick={onBack}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground/80 hover:text-foreground transition-colors font-medium mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>
              
              <div className="text-xs text-muted-foreground/60">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
