import type { Metadata } from "next";
import "./brandbook.css";

export const metadata: Metadata = {
  title: "Brandbook — FP Legal Performance",
  description:
    "Manual de marca da FP Legal Performance — Soluções Jurídicas com Legal Performance. Identidade visual, cores, tipografia e aplicações. OAB/RO 5077.",
};

export default function BrandbookLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="bb-root">{children}</div>;
}
