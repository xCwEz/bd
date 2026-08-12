"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { cle: "catalogue", href: "/", label: "Catalogue", correspond: (p) => p === "/" || p.startsWith("/produit") },
  { cle: "recherche", href: "/recherche", label: "Recherche", correspond: (p) => p.startsWith("/recherche") },
  { cle: "panier", href: "/panier", label: "Panier", correspond: (p) => p.startsWith("/panier") },
  { cle: "compte", href: "/compte", label: "Compte", correspond: (p) => p.startsWith("/compte") },
];

function Icone({ cle, actif }) {
  const couleur = actif ? "var(--texte-primaire)" : "var(--texte-discret)";
  if (cle === "catalogue") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 6px)", gap: 3 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: 1.5, background: couleur }} />
        ))}
      </div>
    );
  }
  if (cle === "recherche") {
    return (
      <span style={{ position: "relative", width: 16, height: 16, display: "block" }}>
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 11,
            height: 11,
            borderRadius: "999px",
            border: `1.5px solid ${couleur}`,
          }}
        />
        <span
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 6,
            height: 1.5,
            background: couleur,
            transform: "rotate(45deg)",
            transformOrigin: "right",
          }}
        />
      </span>
    );
  }
  if (cle === "panier") {
    return (
      <span style={{ position: "relative", width: 16, height: 16, display: "block" }}>
        <span
          style={{
            position: "absolute",
            top: 4,
            left: 2,
            width: 12,
            height: 10,
            border: `1.5px solid ${couleur}`,
            borderRadius: 2,
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 5,
            width: 6,
            height: 5,
            border: `1.5px solid ${couleur}`,
            borderBottom: "none",
            borderRadius: "5px 5px 0 0",
          }}
        />
      </span>
    );
  }
  return <span style={{ width: 14, height: 14, borderRadius: "999px", border: `1.5px solid ${couleur}` }} />;
}

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        maxWidth: 480,
        margin: "0 auto",
        display: "flex",
        borderTop: "1px solid var(--separateur)",
        background: "rgba(12,14,16,.92)",
        backdropFilter: "blur(8px)",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {ONGLETS.map((onglet) => {
        const actif = onglet.correspond(pathname);
        return (
          <Link
            key={onglet.cle}
            href={onglet.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "10px 0 8px",
            }}
          >
            <Icone cle={onglet.cle} actif={actif} />
            <span
              className="mono"
              style={{
                fontSize: 9.5,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: actif ? "var(--texte-primaire)" : "var(--texte-discret)",
              }}
            >
              {onglet.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
