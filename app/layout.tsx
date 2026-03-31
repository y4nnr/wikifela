import type { Metadata } from "next";
import { Geist, Poppins, Libre_Baskerville, Oswald, Black_Ops_One } from "next/font/google";
import localFont from "next/font/local";
import Header from "@/components/Header";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const oswald = Oswald({
  variable: "--font-fela-alt",
  subsets: ["latin"],
  weight: ["700"],
});

const blackOps = Black_Ops_One({
  variable: "--font-fela",
  subsets: ["latin"],
  weight: ["400"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-wiki",
  subsets: ["latin"],
  weight: ["400"],
});

const titleFont = localFont({
  src: "../public/fonts/general-sans-700.woff2",
  variable: "--font-title",
  weight: "700",
  display: "swap",
});

const tanker = localFont({
  src: "../public/fonts/tanker-400.woff2",
  variable: "--font-tanker",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "wikifela — Faites entrer l'accusé",
  description:
    "Recherchez parmi tous les épisodes de Faites entrer l'accusé par nom, affaire ou mot-clé.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${titleFont.variable} ${poppins.variable} ${libreBaskerville.variable} ${tanker.variable} ${oswald.variable} ${blackOps.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-geist-sans)] pb-16 md:pb-0" suppressHydrationWarning>
        <ThemeProvider>
          <Header />
          {children}
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
