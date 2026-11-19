import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbitask — Tata Surya Tugas",
  description:
    "Ubah fokus harianmu menjadi tata surya: matahari adalah main goal, planet-planet adalah tugas yang mengorbit. Klik planet untuk membuka detail, tandai selesai, atau tambah orbit baru.",
};

export const viewport: Viewport = {
  themeColor: "#04060f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
