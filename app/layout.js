import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Juniors Jobs", // Modifiqué el título para que coincida con tu aplicación
  description: "Encuentra ofertas de empleo para juniors.", // Modifiqué la descripción
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={<p>Cargando la página principal...</p>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}