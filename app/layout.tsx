import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ComplaintBanner } from "@/components/complaint-banner";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { DevErrorReporter } from "@/components/dev-error-reporter";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "פולישוק - שוק תחזיות",
  description: "שוק תחזיות בעברית",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        {process.env.NODE_ENV === "development" ? <DevErrorReporter /> : null}
        <ComplaintBanner />
        <Navbar />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
