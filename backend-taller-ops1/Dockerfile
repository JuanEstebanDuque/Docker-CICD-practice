# ---- Etapa 1: build ----
# Imagen ligera de Node (Alpine = Linux minimalista). Usamos Node 22 porque
# la versión de pnpm que usa el equipo localmente (11.x, ver pnpm-lock.yaml
# lockfileVersion 9.0) exige Node >= 22.13.
FROM node:22-alpine AS builder

WORKDIR /app

# corepack ya viene con Node; "prepare ... --activate" fija una versión
# EXACTA de pnpm (la misma que usan localmente), en vez de dejar que
# corepack baje la última versión disponible el día del build. Esto es
# lo mismo que resolvía el paso 2 de deploy.sh, pero de forma reproducible.
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Copiamos primero SOLO los manifiestos de dependencias. Docker cachea capas:
# si package.json/pnpm-lock.yaml no cambian, este paso (el más lento) se
# reusa de una corrida anterior aunque el código fuente sí haya cambiado.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Ahora sí copiamos el resto del código (ver .dockerignore para lo excluido).
COPY . .

# Equivalente al paso 5 de deploy.sh: "nest build" -> genera dist/.
RUN pnpm run build

# ---- Etapa 2: producción ----
# Imagen final: parte de cero (otra capa Alpine limpia), sin devDependencies
# ni código TypeScript, solo lo necesario para ejecutar.
FROM node:22-alpine AS production

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --prod: instala solo "dependencies", no "devDependencies" (nest-cli,
# jest, typescript, etc. se quedan fuera de la imagen final).
RUN pnpm install --frozen-lockfile --prod

# Traemos SOLO el resultado compilado desde la etapa "builder".
COPY --from=builder /app/dist ./dist

# Documenta el puerto en el que escucha Nest (src/main.ts: PORT ?? 5000).
# No abre nada por sí solo; el mapeo real ocurre en docker-compose.yml.
EXPOSE 5000

# Equivalente al paso 8 de deploy.sh ("pnpm run start:prod" == "node dist/main"),
# pero sin nohup/PID/log file: Docker gestiona el proceso, sus logs
# (docker logs) y su ciclo de vida (restart, stop, etc.).
CMD ["node", "dist/main"]
