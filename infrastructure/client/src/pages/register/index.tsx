import { Geist, Geist_Mono } from "next/font/google";
import { RegisterForm } from "@/components/RegisterForm";
import { Header } from "@/components/Header";
import { Toaster } from "react-hot-toast";

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
