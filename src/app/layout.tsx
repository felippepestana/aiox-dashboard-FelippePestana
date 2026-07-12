import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { CookieConsent } from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: {
    default: "APEX Legal Performance | Solução Jurídica Tecnológica de Alta Performance",
    template: "%s | APEX Legal Performance",
  },
  description: "APEX Legal Performance — Solução Jurídica Tecnológica de Alta Performance. Gestão jurídica full-service com IA: processos, peças, prazos, tribunais, precedentes, marketing e estratégia.",
  metadataBase: new URL("https://apex.legal"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://apex.legal",
    siteName: "APEX Legal Performance",
    title: "APEX Legal Performance | Solução Jurídica Tecnológica de Alta Performance",
    description: "Gestão jurídica full-service com IA: processos, peças, prazos, tribunais, precedentes, marketing e estratégia.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "APEX Legal Performance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "APEX Legal Performance | Solução Jurídica Tecnológica de Alta Performance",
    description: "Gestão jurídica full-service com IA: processos, peças, prazos, tribunais, precedentes, marketing e estratégia.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** Root layout that wraps every page with the base HTML shell, theme bootstrap, PWA metadata, service worker registration and cookie consent. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('apex_theme');
                if (t !== 'light') t = 'dark';
                document.documentElement.setAttribute('data-theme', t);
                document.documentElement.classList.toggle('dark', t === 'dark');
              })();
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APEX Legal" />
        <meta name="theme-color" content="#0a1628" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        {children}
        <ServiceWorkerRegistration />
        <CookieConsent />
      </body>
    </html>
  );
}
