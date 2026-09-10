import type { Metadata } from "next";
import { Rajdhani, Manrope, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const titulo = "Pitstop 084";
const descricao =
  "Pitstop 084 — assinatura de lavagem automotiva premium. Lavagem detalhada, manutenção semanal e cuidado completo pro seu carro.";

export const metadata: Metadata = {
  metadataBase: new URL("https://projetopitstop084.vercel.app"),
  title: titulo,
  description: descricao,
  openGraph: {
    title: titulo,
    description: descricao,
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: descricao,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${rajdhani.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-asphalt text-text-primary font-body">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
