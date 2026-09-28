import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PawConnect — Pet Adoption & Rehoming Platform",
  description:
    "A trustworthy and modern platform connecting pet adopters, owners, and shelters.",
};

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={inter.variable}>
        <body className="min-h-screen bg-background font-sans antialiased">
          <ThemeProvider>
            <TooltipProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

