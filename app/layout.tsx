import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Referent — анализ статей",
  description: "Парсинг англоязычных статей и генерация ответов с помощью AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
