import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AfriCarrt",
  description:
    "AfriCarrt connects African and Caribbean grocery stores in Toronto with customers for pickup and delivery.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c6551f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-parchment font-sans text-ink">
        <CartProvider>
          <Header />
          <SearchBar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
