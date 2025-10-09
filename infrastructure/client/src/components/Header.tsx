"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { LogOut } from "lucide-react"
import { authService } from "@/services/authService"

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const token = authService.getStoredToken()
    setIsAuthenticated(!!token)
  }, [])

  const handleLogout = () => {
    authService.removeAuthToken()
    setIsAuthenticated(false)
    window.location.href = '/'
  }

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <motion.div 
          className="flex items-center space-x-2 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          onClick={() => window.location.href = '/'}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-prestige font-bold text-foreground tracking-wide">Lehman Brothers</span>
        </motion.div>

        <nav className="hidden md:flex items-center space-x-8">
          <a href="#services" className="text-muted-foreground/80 hover:text-foreground transition-colors font-medium">
            Services
          </a>
          <a href="#heritage" className="text-muted-foreground/80 hover:text-foreground transition-colors font-medium">
            Heritage
          </a>
          <a href="#contact" className="text-muted-foreground/80 hover:text-foreground transition-colors font-medium">
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-destructive/10 transition-all duration-300 font-medium bg-background/60 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-primary/10 transition-all duration-300 font-medium bg-background/60"
                onClick={() => window.location.href = '/login'}
              >
                Login
              </Button>
              <Button 
                size="sm" 
                className="bg-primary/90 hover:bg-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                onClick={() => window.location.href = '/register'}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
