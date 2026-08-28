#!/usr/bin/env bash
set -euo pipefail

# --- 0. Configuración -------------------------------------------------------
# Puerto donde sirve "next start" (default de Next.js: 3000).
# BACKEND_HOST es la IP/host del PC de Ops-Backend en la red del laboratorio
# (ver taller: Backend y Frontend son dos PCs físicas distintas). Si no se
# pasa, asumimos que ambos corren en la misma máquina (localhost).
# Uso en otra PC: BACKEND_HOST=192.168.1.10 PORT=3000 ./deploy.sh
PORT="${PORT:-3000}"
BACKEND_HOST="${BACKEND_HOST:-localhost}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
LOG_FILE="deploy.log"
PID_FILE="frontend.pid"

# --- 1. Detectar sistema operativo -----------------------------------------
# Igual que en el backend: decide qué herramienta de firewall usar (ufw vs
# netsh) y, más adelante con Docker, puede influir en rutas o el motor de
# contenedores a usar.
case "$(uname -s)" in
  Linux*)   OS="linux" ;;
  Darwin*)  OS="macos" ;;
  MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
  *)        OS="unknown" ;;
esac
echo "==> Sistema operativo detectado: $OS"

# --- 2. Verificar que pnpm está disponible ---------------------------------
# Hay tanto pnpm-lock.yaml como package-lock.json en el repo; nos quedamos con
# pnpm como estándar del equipo (igual que en el backend) para no mezclar
# gestores de paquetes.
if ! command -v pnpm >/dev/null 2>&1; then
  echo "==> pnpm no encontrado, habilitando via corepack..."
  corepack enable
  corepack prepare pnpm@latest --activate
fi

# --- 3. Instalar dependencias -----------------------------------------------
echo "==> Instalando dependencias..."
pnpm install --frozen-lockfile

# --- 4. Lint -----------------------------------------------------------------
echo "==> Corriendo lint..."
pnpm run lint

# --- 5. Compilar el proyecto -------------------------------------------------
# "next build" genera la carpeta .next/ optimizada para producción.
# OJO: NEXT_PUBLIC_BACKEND_URL se "hornea" dentro del bundle en build time
# (variables NEXT_PUBLIC_* no se leen en runtime), así que hay que exportarla
# ANTES de compilar y apuntando al PC físico del backend.
export NEXT_PUBLIC_BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "==> Compilando (next build) contra backend en $NEXT_PUBLIC_BACKEND_URL..."
pnpm run build

# --- 6. Abrir el puerto en el firewall --------------------------------------
# El taller pide firewall activo bloqueando todo salvo el puerto explícito
# del servicio. Aquí es el puerto donde el propio frontend sirve HTTP.
echo "==> Abriendo puerto $PORT/tcp en el firewall ($OS)..."
case "$OS" in
  linux)
    if command -v ufw >/dev/null 2>&1; then
      sudo ufw allow "$PORT"/tcp
    else
      echo "    (!) ufw no está instalado, omito apertura de puerto."
    fi
    ;;
  windows)
    # Requiere una terminal (Git Bash) abierta como Administrador para que
    # netsh pueda crear la regla.
    netsh advfirewall firewall add rule \
      name="front-taller-ops1 ($PORT)" \
      dir=in action=allow protocol=TCP localport="$PORT" \
      || echo "    (!) No se pudo crear la regla (¿corriste como Administrador?)."
    ;;
  macos)
    echo "    (!) macOS usa 'pf', no soportado en este script (fuera de alcance del taller)."
    ;;
  *)
    echo "    (!) SO desconocido, omito apertura de puerto."
    ;;
esac

# --- 7. Levantar en modo producción -----------------------------------------
# "next start" sirve el build de .next/. Lo dejamos corriendo en background
# (nohup) para que el script termine y Ops pueda ver logs con
# `tail -f deploy.log` y detener el proceso con `kill $(cat frontend.pid)`.
# Cuando pasemos a Docker, este paso lo asume el CMD del Dockerfile.
echo "==> Levantando frontend en el puerto $PORT..."
PORT="$PORT" nohup pnpm run start > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "==> Frontend desplegado. PID=$(cat "$PID_FILE") | Puerto=$PORT | Backend=$NEXT_PUBLIC_BACKEND_URL | Logs=$LOG_FILE (SO: $OS)."
