import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIOX Legal - Plataforma Jurídica Full-Service",
  description: "Plataforma de gestão jurídica full-service com IA: processos, peças, prazos, tribunais, precedentes, marketing e estratégia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
