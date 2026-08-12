/**
 * Envoi de notifications via l'API Bot Telegram (`sendMessage`). Si
 * `TELEGRAM_BOT_TOKEN` n'est pas configuré, la fonction ne fait rien plutôt
 * que d'échouer — utile en développement, où aucun bot réel n'existe encore.
 */
/**
 * Échappe les caractères que le mode HTML de Telegram interprète. Sans ça,
 * un nom de pièce contenant « & » ou « < » (« Veste M&S », « Cagoule
 * <ACG> ») fait rejeter tout le message par l'API : l'opérateur ne reçoit
 * simplement jamais la notification de vente, sans erreur visible.
 */
export function echapperHtml(valeur) {
  return String(valeur ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function envoyerMessageTelegram(chatId, texte) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return { envoye: false, raison: "TELEGRAM_BOT_TOKEN ou chatId manquant" };

  try {
    const reponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texte, parse_mode: "HTML" }),
    });
    if (!reponse.ok) return { envoye: false, raison: `Telegram a répondu ${reponse.status}` };
    return { envoye: true };
  } catch (erreur) {
    return { envoye: false, raison: erreur.message };
  }
}

/** Identifiant de conversation de l'opérateur, pour les notifications de vente. */
export function chatIdOperateur() {
  return process.env.TELEGRAM_OPERATOR_CHAT_ID || null;
}

/** Un `telegramUserId` de session ("tg:123456") -> chat_id Telegram utilisable par le bot. */
export function chatIdDepuisUtilisateur(telegramUserId) {
  if (!telegramUserId?.startsWith("tg:")) return null;
  return telegramUserId.slice(3);
}
