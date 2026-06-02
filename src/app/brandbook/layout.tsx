import type { Metadata } from "next";
import "./brandbook.css";

export const metadata: Metadata = {
  title: "Brandbook — APEX Legal Performance",
  description:
    "Manual de marca da APEX Legal Performance — Solução Jurídica Tecnológica de Alta Performance. Identidade visual, cores, tipografia e aplicações.",
};

export default function BrandbookLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="bb-root">{children}</div>;
}
