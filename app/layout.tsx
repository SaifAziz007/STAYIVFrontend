import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StayIV - Property Management Automation",
  description: "AI-Powered Property Management Automation Platform",
};

// Runs inline before hydration to prevent flash of wrong theme (FOUC).
const themeInitScript = `(function(){var t=localStorage.getItem('theme');var dark=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(dark)document.documentElement.classList.add('dark');})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
