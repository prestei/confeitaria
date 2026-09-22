import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Sora, Pacifico } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const brand = Pacifico({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "DocePedido — Cardápio e encomendas para confeiteiras",
  description:
    "Apresente seus produtos, organize encomendas e receba pedidos pelo WhatsApp — feito para confeiteiras e docerias.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${sora.variable} ${brand.variable} h-full`}
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
