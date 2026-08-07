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
  metadataBase: new URL("https://bgf-garage.fr"),
  title: "BGF — Garage d'exception à Lyon",
  description:
    "BGF, atelier automobile haut de gamme à Lyon. Entretien, réparation, diagnostic, carrosserie et préparation esthétique, exécutés avec la précision d'un atelier d'exception.",
  keywords: [
    "garage Lyon",
    "entretien automobile",
    "carrosserie Lyon",
    "diagnostic automobile",
    "préparation esthétique",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "BGF — Garage d'exception à Lyon",
    description:
      "Entretien, réparation, diagnostic, carrosserie et préparation esthétique. Un atelier d'exception à Lyon.",
    siteName: "BGF",
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
  "@type": "AutoRepair",
  name: contact.raisonSociale,
  description:
    "Atelier automobile haut de gamme à Lyon : entretien, réparation, diagnostic, carrosserie et préparation esthétique.",
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
