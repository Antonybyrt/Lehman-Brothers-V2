import { Geist, Geist_Mono } from "next/font/google";
import Dashboard from "@/components/Dashboard";
import { GetStaticPropsContext } from 'next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function DashboardPage() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      <Dashboard />
    </div>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`../../../messages/${locale}.json`)).default
    }
  };
}
