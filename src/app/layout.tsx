import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sbarzi Odontologia - Plataforma IA",
  description: "Plataforma de gestão odontológica com inteligência artificial - Sbarzi Odontologia e Saúde",
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
