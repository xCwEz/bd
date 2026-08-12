/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Image de production allégée pour le déploiement Docker (VPS/Railway/Fly) —
  // voir DEPLOIEMENT.md. Sans effet sur `npm run dev`.
  output: "standalone",
};

export default nextConfig;
