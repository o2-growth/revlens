import type { Metadata } from "next";
import { Anton, Host_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display — títulos e métricas-herói (identidade O2, condensado e forte)
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

// UI / corpo — labels, textos, navegação
const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-host",
});

// Readouts — tempo de fala, timestamps, scores (instrumento)
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "revlens",
  description:
    "Revenue intelligence para calls de vendas — resumos, objeções e próximos passos gerados por IA a partir de transcrições do Google Meet.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${hostGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
