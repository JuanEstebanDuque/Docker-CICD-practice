FROM node:22-alpine AS builder

WORKDIR /app

# corepack ya viene con Node; "prepare ... --activate" fija una versión
# EXACTA de pnpm (la misma que usan localmente), en vez de dejar que
# corepack baje la última versión disponible el día del build. Esto es
# lo mismo que resolvía el paso 2 de deploy.sh, pero de forma reproducible.
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build


FROM node:22-alpine AS production

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
ENV NODE_ENV=production
ENV BACKEND_URL=http://localhost:5000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# .next/ es el build compilado. public/ son assets estáticos servidos tal
# cual (imágenes, favicon). next.config.ts lo vuelve a leer "next start" en
# tiempo de ejecución, así que también debe estar presente.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["pnpm", "start"]