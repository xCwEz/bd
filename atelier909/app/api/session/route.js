import { NextResponse } from "next/server";
import { verifierInitData, creerJetonUtilisateur, COOKIE_UTILISATEUR, DUREE_COOKIE_MS, utilisateurCourant } from "@/lib/session";

/**
 * Établit la session à partir du `initData` Telegram transmis par le client.
 * Si `TELEGRAM_BOT_TOKEN` n'est pas configuré (développement local, hors
 * webview Telegram), on retombe sur une session de démonstration pour que le
 * parcours reste testable — jamais en production, où le token est requis et
 * la signature vérifiée.
 */
export async function POST(requete) {
  const initData = await requete.text();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

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
    telegramUserId = existant?.id ?? `demo:${Math.random().toString(36).slice(2, 10)}`;
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
