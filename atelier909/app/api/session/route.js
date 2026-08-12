import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { verifierInitData, creerJetonUtilisateur, COOKIE_UTILISATEUR, DUREE_COOKIE_MS, utilisateurCourant } from "@/lib/session";

/**
 * Établit la session à partir du `initData` Telegram transmis par le client.
 * Sans `TELEGRAM_BOT_TOKEN` (développement local, hors webview Telegram), on
 * retombe sur une session de démonstration pour que le parcours reste
 * testable. Ce repli est refusé en production : il donnerait une session
 * valide à n'importe quel visiteur anonyme, capable de bloquer du stock
 * sans aucune identité Telegram derrière.
 */
export async function POST(requete) {
  const initData = await requete.text();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "TELEGRAM_BOT_TOKEN non configuré : sessions indisponibles." },
      { status: 503 }
    );
  }

  let telegramUserId;
  let profil = {};

  if (botToken) {
    const utilisateur = verifierInitData(initData, botToken);
    if (!utilisateur) {
      return NextResponse.json({ message: "Session Telegram invalide." }, { status: 401 });
    }
    telegramUserId = `tg:${utilisateur.id}`;
    profil = { username: utilisateur.username, prenom: utilisateur.first_name };
  } else {
    const existant = await utilisateurCourant();
    telegramUserId = existant?.id ?? `demo:${randomBytes(6).toString("hex")}`;
    profil = { username: existant?.username ?? "demo_909", prenom: existant?.prenom ?? "Invité" };
  }

  const reponse = NextResponse.json({ ok: true, demo: !botToken });
  reponse.cookies.set(COOKIE_UTILISATEUR, creerJetonUtilisateur(telegramUserId, profil), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_COOKIE_MS / 1000,
  });
  return reponse;
}
