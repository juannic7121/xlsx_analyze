import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Análisis Código B — Comparación Ger",
  description:
    "Compara el dataset Ger con otro listado TXT y genera estadísticas de firmas, coincidencias y exclusivas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
