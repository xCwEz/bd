import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE_SESSION = "admin_session";
const DUREE_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function secret() {
  const valeur = process.env.ADMIN_SESSION_SECRET;
  if (!valeur) throw new Error("ADMIN_SESSION_SECRET manquant (voir .env.example).");
  return valeur;
}

function signer(payload) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
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
  const [expiration, signature] = jeton.split(".");
  if (!expiration || !signature) return false;
  if (Date.now() > Number(expiration)) return false;
  const attendu = signer(expiration);
  const a = Buffer.from(signature);
  const b = Buffer.from(attendu);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
