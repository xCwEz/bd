import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--police-interface",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--police-mono",
  display: "swap",
});

export const metadata = {
  title: "ATELIER 909",
  description: "Sportswear rare — pièces uniques, remise en main propre.",
};

export const viewport = {
  themeColor: "#0a0b0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
