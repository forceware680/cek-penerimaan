import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Archivo_Black } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Neobrutalism system: Space Grotesk is the workhorse face (login + dashboard);
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// Archivo Black is a static (400-only) font: no CSS variable, use className.
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "SI GEPENG - Cek Penerimaan",
  description: "Sistem Informasi Generator Pengeluaran - Cek Penerimaan",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      {/* Login logo is the page's LCP element but only mounts after
          hydration (auth gate); preload it so the fetch starts with the
          document. (Next 16 also registers this in its own preload pipeline;
          the browser de-duplicates the request.) */}
      <head>
        <link rel="preload" as="image" href="/logo-bpkad.webp" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${archivoBlack.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
