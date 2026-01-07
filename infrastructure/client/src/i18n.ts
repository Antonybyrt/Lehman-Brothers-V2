/**
 * i18n Configuration
 * Centralized internationalization setup for the application
 */

// Available locales
export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'fr';

// Locale labels for UI
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};
