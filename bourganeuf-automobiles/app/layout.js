import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import { contact, horaires } from "@/lib/data";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--police-titre",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--police-texte",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://bourganeuf-automobiles.fr"),
  title: "Bourganeuf Automobiles — Garage & concession à Bourganeuf, Creuse",
  description:
    "Bourganeuf Automobiles, garage et concession à Bourganeuf (Creuse). Entretien, réparation, diagnostic, carrosserie, préparation esthétique, et un stock de véhicules d'occasion révisés dans notre propre atelier.",
  keywords: [
    "garage Bourganeuf",
    "garage Creuse",
    "entretien automobile",
    "carrosserie Creuse",
    "diagnostic automobile",
    "véhicules d'occasion Creuse",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Bourganeuf Automobiles — Garage & concession à Bourganeuf, Creuse",
    description:
      "Entretien, réparation, diagnostic, carrosserie, préparation esthétique, et un stock de véhicules d'occasion révisés dans notre propre atelier.",
    siteName: "Bourganeuf Automobiles",
  },
};

export const viewport = {
  themeColor: "#0B0B0B",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/* Données structurées : elles décrivent la fiche de l'atelier telle qu'elle
   figure dans lib/data.js. Elles suivent donc les mêmes valeurs fictives. */
const donneesStructurees = {
  "@context": "https://schema.org",
  "@type": ["AutoRepair", "AutoDealer"],
  name: contact.raisonSociale,
  description:
    "Garage et concession à Bourganeuf (Creuse) : entretien, réparation, diagnostic, carrosserie, préparation esthétique, et véhicules d'occasion.",
  telephone: contact.telephoneLien,
  email: contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: contact.adresse.ligne1,
    postalCode: contact.adresse.codePostal,
    addressLocality: contact.adresse.ville,
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: contact.geo.lat,
    longitude: contact.geo.lon,
  },
  openingHours: horaires
    .filter((ligne) => !ligne.ferme)
    .map((ligne) => `${ligne.jour} ${ligne.plage}`),
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <body>
        <a className="evitement" href="#services">
          Aller au contenu
        </a>
        {/* Sans JavaScript, les révélations au scroll ne se déclenchent
            jamais : on annule leur état initial pour que rien ne reste
            invisible. */}
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(donneesStructurees),
          }}
        />
      </body>
    </html>
  );
}
