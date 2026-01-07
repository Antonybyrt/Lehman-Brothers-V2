/**
 * ErrorContent Component (Molecule)
 * Atomic Design: Molecule level component for error message display
 * Displays error code, title, description with consistent styling
 */

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { useTranslations } from 'next-intl'

interface ErrorContentProps {
  code: string
  title: string
  description: string
  icon: LucideIcon
}

export function ErrorContent({ code, title, description, icon: Icon }: ErrorContentProps) {
  return (
    <motion.div
      className="text-center max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Error Icon */}
      <motion.div
        className="mb-8 flex justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <Icon className="w-24 h-24 text-primary relative z-10" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Error Code */}
      <motion.h1
        className="text-9xl md:text-[12rem] font-prestige font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4 leading-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {code}
      </motion.h1>

      {/* Error Title */}
      <motion.h2
        className="text-3xl md:text-5xl font-prestige font-semibold text-foreground/90 mb-6 tracking-wide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {title}
      </motion.h2>

      {/* Error Description */}
      <motion.p
        className="text-lg md:text-xl text-muted-foreground/80 leading-relaxed font-light"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {description}
      </motion.p>
    </motion.div>
  )
}

