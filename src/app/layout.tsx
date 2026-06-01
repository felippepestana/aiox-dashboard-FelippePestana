import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "FP Legal Performance – Felippe Pestana | Soluções Jurídicas Especializadas",
  description: "Felippe Pestana – Soluções Jurídicas Especializadas com Legal Performance. Gestão jurídica full-service com IA: processos, peças, prazos, tribunais, precedentes, marketing e estratégia. OAB/RO 5077.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA iOS / mobile meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FP Legal" />
        <meta name="theme-color" content="#0a1628" />

        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
