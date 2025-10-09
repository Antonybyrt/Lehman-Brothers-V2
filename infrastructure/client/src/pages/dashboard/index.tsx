import { Geist, Geist_Mono } from "next/font/google";
import Dashboard from "@/components/Dashboard";

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
