import type { Metadata } from "next";
import { ThemeProvider } from '@/components/forever/theme-provider';
import "./globals.css";

export const metadata: Metadata = {
  title: "Unser kleines Für immer · Leticia & Gérôme",
  description: "Unsere gemeinsame Zeit, kleine Liebesbriefe und eine Karte voller Erinnerungen.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="antialiased"><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
