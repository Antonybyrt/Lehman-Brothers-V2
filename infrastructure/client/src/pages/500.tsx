/**
 * 500 Error Page
 * Custom error page for "Internal Server Error"
 * Follows atomic design pattern and brand guidelines
 */

import { Geist, Geist_Mono } from "next/font/google"
import { ServerCrash } from "lucide-react"
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

export default function Custom500() {
  const t = useTranslations('errors.500')

  return (
    <>
      <Head>
        <title>{`500 - ${t('title')} | Lehman Brothers Heritage`}</title>
        <meta name="description" content={t('description')} />
      </Head>

      <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ErrorLayout showBackButton={false}>
          <ErrorContent
            code="500"
            title={t('title')}
            description={t('description')}
            icon={ServerCrash}
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

