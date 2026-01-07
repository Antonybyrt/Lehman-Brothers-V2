/**
 * LanguageSwitcher Component (Atom)
 * Atomic Design: Atom level component for language selection
 * Allows users to switch between supported locales
 */

"use client"

import { useRouter } from 'next/router'
import { Button } from './button'
import { Globe } from 'lucide-react'
import { locales, localeLabels, type Locale } from '@/i18n'

export function LanguageSwitcher() {
  const router = useRouter()
  const currentLocale = (router.locale || 'fr') as Locale

  const switchLocale = (locale: Locale) => {
    
    const { pathname, asPath, query } = router
    router.push({ pathname, query }, asPath, { locale })
      .then(() => {
        console.log('Navigation success, new locale:', router.locale)
      })
      .catch((err) => {
        console.error('Navigation error:', err)
      })
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      {locales.map((locale) => (
        <Button
          key={locale}
          variant={currentLocale === locale ? 'default' : 'ghost'}
          size="sm"
          onClick={() => switchLocale(locale)}
          className="uppercase text-xs font-medium"
        >
          {locale}
        </Button>
      ))}
    </div>
  )
}

