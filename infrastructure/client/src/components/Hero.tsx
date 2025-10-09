"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowRight, Shield, Zap, Globe } from "lucide-react"
import SplineBackground from "./SplineBackground"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Spline 3D Background */}
      <SplineBackground />
      
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/5 via-background/3 to-background/8" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-prestige font-bold text-foreground/90 mb-8 leading-tight tracking-wide">
              Lehman Brothers
              <span className="block text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-extrabold">Heritage</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground/80 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Since 1850, we have shaped banking excellence with a tradition of innovation and trust. 
              Your wealth deserves prestige.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Button size="lg" className="text-lg px-10 py-6 bg-primary/90 hover:bg-primary/80 shadow-xl hover:shadow-2xl transition-all duration-300 font-medium">
              Discover our services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-2 border-primary/30 hover:bg-primary/5 transition-all duration-300 font-medium bg-background/60">
              Our history
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
