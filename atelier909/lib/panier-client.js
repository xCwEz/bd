/** Établit (ou confirme) la session avant tout appel aux API du panier. */
export async function assurerSession() {
  const initData = window.Telegram?.WebApp?.initData ?? "";
  await fetch("/api/session", { method: "POST", body: initData });
}
