/**
 * ErrorLayout Component (Template)
 * Atomic Design: Template level component for error pages
 * Provides consistent layout structure for all error pages
 */

"use client"

"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Home, ArrowLeft } from "lucide-react"
import { useRouter } from "next/router"
import SplineBackground from "@/components/SplineBackground"
import { useTranslations } from 'next-intl'

interface ErrorLayoutProps {
  children: ReactNode
  showBackButton?: boolean
}

export function ErrorLayout({ children, showBackButton = true }: ErrorLayoutProps) {
  const router = useRouter()
  const t = useTranslations('errors')

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Spline 3D Background */}
      <SplineBackground />
      
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/5 via-background/3 to-background/8" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Error Content */}
        <div className="mb-12">
          {children}
        </div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Button
            size="lg"
            onClick={() => router.push('/')}
            className="text-lg px-10 py-6 bg-primary/90 hover:bg-primary/80 shadow-xl hover:shadow-2xl transition-all duration-300 font-medium"
          >
            <Home className="mr-2 h-5 w-5" />
            {t('returnHome')}
          </Button>

          {showBackButton && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              className="text-lg px-10 py-6 border-2 border-primary/30 hover:bg-primary/5 transition-all duration-300 font-medium bg-background/60"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {t('goBack')}
            </Button>
          )}
        </motion.div>

        {/* Decorative element */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <p className="text-sm text-muted-foreground/60 font-prestige">
            {t('footer', { defaultMessage: 'Lehman Brothers Heritage • Since 1850' })}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

