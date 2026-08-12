import { NextResponse } from "next/server";
import { motDePasseValide, creerJetonSession, COOKIE_SESSION } from "@/lib/auth";

export async function POST(requete) {
  const donnees = await requete.formData();
  const motDePasse = donnees.get("motDePasse");
  const origine = new URL(requete.url).origin;

  if (!motDePasseValide(motDePasse)) {
    return NextResponse.redirect(`${origine}/admin/connexion?echec=1`, 303);
  }

  const reponse = NextResponse.redirect(`${origine}/admin`, 303);
  reponse.cookies.set(COOKIE_SESSION, creerJetonSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return reponse;
}
