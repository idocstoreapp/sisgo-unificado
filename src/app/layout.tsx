import type { Metadata } from "next";
import { Providers } from "@/presentation/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SISGO - Sistema de Gestión Unificado",
  description:
    "Sistema de gestión unificado para empresas de servicio técnico, talleres, mueblerías y restaurantes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
