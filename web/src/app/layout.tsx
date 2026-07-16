import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Zabran Workspaces",
  description: "Platform Manajemen Bisnis Terpadu — PT Zabran Internasional Grup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Providers>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster position="top-right" toastOptions={{
              className: 'dark:bg-glass-bg dark:text-foreground dark:border-glass-border bg-white text-gray-900 border-gray-200',
              style: { border: '1px solid currentColor' }
            }} />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
