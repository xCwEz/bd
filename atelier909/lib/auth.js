import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE_SESSION = "admin_session";
const DUREE_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

/**
 * Étiquette de domaine incluse dans la signature. Le cookie utilisateur
 * (lib/session.js) est signé avec le même secret : sans cette séparation,
 * un jeton émis pour l'un valide pour l'autre, et n'importe quel visiteur
 * peut se hisser administrateur en recopiant son propre cookie.
 * Ne jamais réutiliser cette valeur ailleurs.
 */
const DOMAINE = "atelier909/admin-v1";

function secret() {
  const valeur = process.env.ADMIN_SESSION_SECRET;
  if (!valeur) throw new Error("ADMIN_SESSION_SECRET manquant (voir .env.example).");
  return valeur;
}

function signer(payload) {
  return createHmac("sha256", secret()).update(`${DOMAINE}:${payload}`).digest("hex");
}

export function motDePasseValide(motDePasse) {
  const attendu = process.env.ADMIN_PASSWORD;
  if (!attendu || !motDePasse) return false;
  const a = Buffer.from(motDePasse);
  const b = Buffer.from(attendu);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function creerJetonSession() {
  const expiration = Date.now() + DUREE_SESSION_MS;
  const signature = signer(String(expiration));
  return `${expiration}.${signature}`;
}

export async function estAdminConnecte() {
  const magasin = await cookies();
  return jetonSessionValide(magasin.get(COOKIE_SESSION)?.value);
}

export function jetonSessionValide(jeton) {
  if (!jeton) return false;
  const parties = jeton.split(".");
  if (parties.length !== 2) return false;
  const [expiration, signature] = parties;
  if (!expiration || !signature) return false;
  // `Number()` d'une charge non numérique vaut NaN, et toute comparaison
  // avec NaN est fausse : sans ce contrôle explicite, un jeton d'un autre
  // type traversait le test d'expiration sans être rejeté.
  const expirationMs = Number(expiration);
  if (!Number.isFinite(expirationMs) || Date.now() > expirationMs) return false;
  const attendu = signer(expiration);
  const a = Buffer.from(signature);
  const b = Buffer.from(attendu);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
