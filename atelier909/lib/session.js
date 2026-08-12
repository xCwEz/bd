import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE_UTILISATEUR = "atelier909_session";
const DUREE_COOKIE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours
const DUREE_MAX_INIT_DATA_MS = 24 * 60 * 60 * 1000; // 24h, anti-rejeu

/**
 * Vérifie la signature d'un `initData` de Telegram Mini App côté serveur.
 * Algorithme officiel : voir
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * « Sans cette vérification, n'importe qui peut se faire passer pour un
 * autre utilisateur. Point non négociable. » (README de passation)
 */
export function verifierInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hashRecu = params.get("hash");
  if (!hashRecu) return null;
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cle, valeur]) => `${cle}=${valeur}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hashCalcule = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  const a = Buffer.from(hashCalcule);
  const b = Buffer.from(hashRecu);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get("auth_date")) * 1000;
  if (!authDate || Date.now() - authDate > DUREE_MAX_INIT_DATA_MS) return null;

  try {
    return JSON.parse(params.get("user"));
  } catch {
    return null;
  }
}

/**
 * Étiquette de domaine incluse dans la signature — voir le commentaire
 * équivalent dans lib/auth.js. Les deux cookies partagent le même secret :
 * seule cette distinction empêche un jeton utilisateur de valider comme
 * jeton administrateur.
 */
const DOMAINE = "atelier909/utilisateur-v1";

function secretCookie() {
  const valeur = process.env.ADMIN_SESSION_SECRET;
  if (!valeur) throw new Error("ADMIN_SESSION_SECRET manquant (voir .env.example).");
  return valeur;
}

function signer(payload) {
  return createHmac("sha256", secretCookie()).update(`${DOMAINE}:${payload}`).digest("hex");
}

/** `profil` : { username, prenom } — facultatif, absent en mode démo. */
export function creerJetonUtilisateur(telegramUserId, profil = {}) {
  const charge = {
    id: telegramUserId,
    u: profil.username ?? null,
    n: profil.prenom ?? null,
    exp: Date.now() + DUREE_COOKIE_MS,
  };
  const chargeEncodee = Buffer.from(JSON.stringify(charge)).toString("base64url");
  return `${chargeEncodee}.${signer(chargeEncodee)}`;
}

function jetonValide(jeton) {
  if (!jeton) return null;
  const parties = jeton.split(".");
  if (parties.length !== 2) return null;
  const [chargeEncodee, signature] = parties;
  if (!chargeEncodee || !signature) return null;

  const attendu = signer(chargeEncodee);
  const a = Buffer.from(signature);
  const b = Buffer.from(attendu);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const charge = JSON.parse(Buffer.from(chargeEncodee, "base64url").toString("utf-8"));
    if (!Number.isFinite(charge.exp) || Date.now() > charge.exp) return null;
    if (typeof charge.id !== "string" || !charge.id) return null;
    return { id: charge.id, username: charge.u, prenom: charge.n };
  } catch {
    return null;
  }
}

/** Utilisateur courant d'après le cookie ({ id, username, prenom }), ou null. */
export async function utilisateurCourant() {
  const magasin = await cookies();
  return jetonValide(magasin.get(COOKIE_UTILISATEUR)?.value);
}

export const ENTETE_INIT_DATA = "x-telegram-init-data";

/**
 * Identifie l'appelant d'une requête d'API. L'`initData` transmis en
 * en-tête fait foi ; le cookie ne sert que de repli.
 *
 * Pourquoi ne pas se reposer sur le cookie : sur Telegram Web, la Mini App
 * est chargée dans une iframe, donc dans un contexte tiers. Un cookie
 * `SameSite=Lax` n'y est pas transmis, et les navigateurs bloquent
 * désormais les cookies tiers par défaut — la session serait simplement
 * absente pour ces utilisateurs. Authentifier chaque appel avec l'initData
 * signé règle le problème et supprime au passage toute prise CSRF : une
 * page tierce ne peut pas fabriquer cet en-tête.
 */
export async function utilisateurDeLaRequete(requete) {
  const initData = requete?.headers?.get(ENTETE_INIT_DATA);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (botToken && initData) {
    const utilisateur = verifierInitData(initData, botToken);
    if (utilisateur) {
      return {
        id: `tg:${utilisateur.id}`,
        username: utilisateur.username ?? null,
        prenom: utilisateur.first_name ?? null,
      };
    }
    // En-tête présent mais invalide : on refuse plutôt que de retomber
    // silencieusement sur le cookie.
    return null;
  }

  return utilisateurCourant();
}

export { DUREE_COOKIE_MS };
