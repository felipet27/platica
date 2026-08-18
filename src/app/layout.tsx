import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Platíca - Finanzas Personales",
  description: "Gestiona tus ingresos y egresos, visualiza tus compromisos del mes y recibe consejos de ahorro personalizados.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
