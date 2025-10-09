import { Geist, Geist_Mono } from "next/font/google";
import { LoginForm } from "@/components/LoginForm";
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

export default function Login() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      <Header />
      <LoginForm />
      <Toaster />
    </div>
  );
}
