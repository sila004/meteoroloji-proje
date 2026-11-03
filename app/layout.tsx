
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import "./globals.css";
import "./app.css";

export const metadata: Metadata = {
  title: "Meteoroloji | Türkiye Hava Durumu",
  description: "Türkiye şehirleri için güncel hava durumu ve tahminler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
