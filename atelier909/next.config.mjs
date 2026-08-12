/** @type {import('next').NextConfig} */

/**
 * En-têtes de sécurité.
 *
 * Volontairement PAS de `X-Frame-Options` ni de `frame-ancestors` fermé :
 * Telegram Web charge la Mini App dans une iframe, les interdire couperait
 * l'application. On restreint donc plutôt ce que la page peut charger et
 * exécuter.
 */
const enTetesSecurite = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Le SDK Telegram est chargé depuis telegram.org ; 'unsafe-inline'
      // reste nécessaire aux styles en ligne de React.
      "script-src 'self' 'unsafe-inline' https://telegram.org",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors https://web.telegram.org https://telegram.org",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig = {
  reactStrictMode: true,
  // Image de production allégée pour le déploiement Docker (VPS/Railway/Fly) —
  // voir DEPLOIEMENT.md. Sans effet sur `npm run dev`.
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:chemin*", headers: enTetesSecurite }];
  },
};

export default nextConfig;
