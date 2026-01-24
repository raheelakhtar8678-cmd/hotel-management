import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/MainNav";
import { ToastProvider } from "@/components/toast-provider";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "YieldVibe | Revenue Management",
  description: "Self-hosted Hotel Revenue Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} min-h-screen bg-background antialiased`}>
        <div className="relative flex min-h-screen flex-col">
          <MainNav />
          <main className="flex-1">{children}</main>
        </div>
        <ToastProvider />
      </body>
    </html>
  );
}
