import { estAdminConnecte } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PageConnexion({ searchParams }) {
  if (await estAdminConnecte()) redirect("/admin");
  const params = await searchParams;
  const echec = params?.echec === "1";

  return (
    <div style={{ padding: "60px 24px", maxWidth: 360, margin: "0 auto" }}>
      <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 24 }}>Back-office — ATELIER 909</h1>
      <form action="/api/admin/login" method="POST" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="password"
          name="motDePasse"
          placeholder="Mot de passe"
          autoFocus
          required
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--bordure-claire)",
            background: "#14171a",
            color: "var(--texte-primaire)",
          }}
        />
        <button type="submit" className="chrome-bouton" style={{ padding: 13, borderRadius: 10, fontWeight: 700 }}>
          Entrer
        </button>
        {echec && (
          <p style={{ color: "var(--accent-alerte)", fontSize: 13 }}>Mot de passe incorrect.</p>
        )}
      </form>
    </div>
  );
}
