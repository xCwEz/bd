/**
 * Authentification des appels d'API côté navigateur.
 *
 * L'`initData` signé par Telegram accompagne chaque requête : c'est lui qui
 * fait foi côté serveur. Le cookie de session ne sert que de repli (mode
 * démonstration hors Telegram) — sur Telegram Web la Mini App tourne dans
 * une iframe, contexte tiers où le cookie n'est pas transmis.
 */

function initData() {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp?.initData ?? "";
}

/** En-têtes à joindre à tout appel d'API authentifié. */
export function entetesSession(supplementaires = {}) {
  const entetes = { ...supplementaires };
  const donnees = initData();
  if (donnees) entetes["X-Telegram-Init-Data"] = donnees;
  return entetes;
}

/** `fetch` auto-authentifié : même signature que `fetch`. */
export function appelApi(url, options = {}) {
  return fetch(url, { ...options, headers: entetesSession(options.headers) });
}

/**
 * Établit le cookie de session. Sert au mode démonstration local ; en
 * production l'en-tête suffit, mais l'appel reste inoffensif.
 */
export async function assurerSession() {
  await fetch("/api/session", { method: "POST", body: initData() });
}
