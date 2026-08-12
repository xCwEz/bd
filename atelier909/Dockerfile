# Image de production pour VPS / Railway / Fly.io — pas pour Vercel : voir
# DEPLOIEMENT.md pour pourquoi (stockage local des médias et des photos
# d'identité, données JSON sur disque).

FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 atelier909

COPY --from=builder /app/public ./public
COPY --from=builder --chown=atelier909:nodejs /app/.next/standalone ./
COPY --from=builder --chown=atelier909:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=atelier909:nodejs /app/data ./data

# Créés ici pour que les points de montage existent avec les bons droits
# même avant qu'un volume ne soit attaché (voir DEPLOIEMENT.md).
RUN mkdir -p /app/stockage/identites /app/public/produits \
  && chown -R atelier909:nodejs /app/stockage /app/public/produits

USER atelier909
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
