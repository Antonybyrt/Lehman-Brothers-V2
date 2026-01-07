import { Geist, Geist_Mono } from "next/font/google";
import { RegisterForm } from "@/components/RegisterForm";
import { Header } from "@/components/Header";
import { Toaster } from "react-hot-toast";
import { GetStaticPropsContext } from 'next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Register() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      <Header />
      <RegisterForm />
      <Toaster />
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
