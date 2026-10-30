import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PwaRegister } from "@/presentation/components/pwa-register";
import { ThemeProvider } from "@/presentation/components/theme-provider";
import { AppToaster } from "@/presentation/components/toaster";
import "./globals.css";

const handelGothic = localFont({
  src: "./fonts/handel-gothic-d-bold.otf",
  variable: "--font-handel",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "SiloPay",
  title: "SiloPay",
  description: "Gestão financeira de funcionários a campo",
  appleWebApp: {
    capable: true,
    title: "SiloPay",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#18304F",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={handelGothic.variable}>
        <ThemeProvider>
          {children}
          <AppToaster />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
