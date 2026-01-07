import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { setupAxiosInterceptors } from "@/utils/axiosInterceptor";
import { NextIntlClientProvider } from 'next-intl';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Setup global axios interceptors for error handling
    setupAxiosInterceptors();
  }, []);

  return (
    <NextIntlClientProvider
      locale={router.locale || 'fr'}
      messages={pageProps.messages}
      timeZone="Europe/Paris"
    >
      <AuthProvider>
        <div className="font-sans">
          <Component {...pageProps} />
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
