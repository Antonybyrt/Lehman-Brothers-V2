import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      <Header />
      <Hero />
    </div>
  );
}
