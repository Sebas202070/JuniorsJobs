// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from 'react';
import Script from 'next/script'; // Importa el componente Script de Next.js

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata = {
  title: "Juniors Jobs", // Modifiqué el título para que coincida con tu aplicación
  description: "Encuentra ofertas de empleo para juniors.", // Modifiqué la descripción
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=TU_ID_DE_MEDICION_GA4" // Reemplaza "TU_ID_DE_MEDICION_GA4" con tu ID de medición real
          strategy="afterInteractive" // Carga el script después de que la página se vuelve interactiva
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'TU_ID_DE_MEDICION_GA4'); // Reemplaza "TU_ID_DE_MEDICION_GA4" con tu ID de medición real
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={<p></p>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}