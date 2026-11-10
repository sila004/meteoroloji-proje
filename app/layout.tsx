
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import ThemeProvider from "./components/ThemeProvider";
import WeatherLibraryProvider from "./components/WeatherLibraryProvider";
import WeatherAttribution from "./components/WeatherAttribution";
import { themeInitializationScript } from "./lib/theme";
import "./globals.css";
import "./app.css";
import "./theme.css";

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
    <html lang="tr" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <ThemeProvider>
          <WeatherLibraryProvider>
          <Navbar />
          {children}
          <WeatherAttribution />
          </WeatherLibraryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
