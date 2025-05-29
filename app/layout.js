import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QueryProvider } from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "E-Registratură",
  description: "Aplicație pentru gestionarea registraturilor electronice",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
        {children}
        </QueryProvider>

        <Toaster />
      </body>
    </html>
  );
}
