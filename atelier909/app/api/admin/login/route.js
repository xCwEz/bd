import { NextResponse } from "next/server";
import { motDePasseValide, creerJetonSession, COOKIE_SESSION } from "@/lib/auth";
import { tropDeTentatives, enregistrerEchec, reinitialiser, cleAppelant } from "@/lib/limitation";

export async function POST(requete) {
  const donnees = await requete.formData();
  const motDePasse = donnees.get("motDePasse");
  const origine = new URL(requete.url).origin;
  const cle = cleAppelant(requete);

  if (tropDeTentatives(cle)) {
    return NextResponse.redirect(`${origine}/admin/connexion?echec=trop`, 303);
  }

  if (!motDePasseValide(motDePasse)) {
    enregistrerEchec(cle);
    return NextResponse.redirect(`${origine}/admin/connexion?echec=1`, 303);
  }

  reinitialiser(cle);
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
