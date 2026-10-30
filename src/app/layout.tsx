import type { ReactNode } from "react";
import localFont from "next/font/local";
import { ThemeProvider } from "@/presentation/components/theme-provider";
import { AppToaster } from "@/presentation/components/toaster";
import "./globals.css";

const handelGothic = localFont({
  src: "./fonts/handel-gothic-d-bold.otf",
  variable: "--font-handel",
  weight: "700",
  display: "swap",
});

export const metadata = {
  title: "SiloPay",
  description: "Gestão financeira de funcionários a campo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={handelGothic.variable}>
        <ThemeProvider>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
