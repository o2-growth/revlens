import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "revlens",
  description: "Revenue intelligence para calls de vendas — resumos, objeções e próximos passos gerados por IA a partir de transcrições do Google Meet.",
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
    <html lang="pt-BR">
      <body className="bg-rl-deep text-rl-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
