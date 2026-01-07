/**
 * 404 Error Page
 * Custom error page for "Page Not Found" errors
 * Follows atomic design pattern and brand guidelines
 */

import { Geist, Geist_Mono } from "next/font/google"
import { SearchX } from "lucide-react"
import { ErrorLayout } from "@/components/errors/ErrorLayout"
import { ErrorContent } from "@/components/errors/ErrorContent"
import Head from "next/head"
import { useTranslations } from 'next-intl'
import { GetStaticPropsContext } from 'next'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export default function Custom404() {
  const t = useTranslations('errors.404')

  return (
    <>
      <Head>
        <title>404 - {t('title')} | Lehman Brothers Heritage</title>
        <meta name="description" content={t('description')} />
      </Head>
      
      <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ErrorLayout showBackButton={true}>
          <ErrorContent
            code="404"
            title={t('title')}
            description={t('description')}
            icon={SearchX}
          />
        </ErrorLayout>
      </div>
    </>
  )
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`../../messages/${locale}.json`)).default
    }
  };
}

