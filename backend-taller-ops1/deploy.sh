#!/usr/bin/env bash
set -euo pipefail

# --- 0. Configuración -------------------------------------------------------
# Puerto donde escucha Nest (ver src/main.ts: process.env.PORT ?? 5000).
# Se puede sobreescribir: PORT=8080 ./deploy.sh
PORT="${PORT:-5000}"
LOG_FILE="deploy.log"
PID_FILE="backend.pid"

# --- 1. Detectar sistema operativo -----------------------------------------
# uname -s da un string distinto por SO. Lo usamos para decidir con qué
# herramienta se abre el firewall (ufw vs netsh) y más adelante, con Docker,
# para ramificar rutas o el motor de contenedores.
case "$(uname -s)" in
  Linux*)   OS="linux" ;;
  Darwin*)  OS="macos" ;;
  MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
  *)        OS="unknown" ;;
esac
echo "==> Sistema operativo detectado: $OS"

# --- 2. Verificar que pnpm está disponible ---------------------------------
# El proyecto usa pnpm (hay pnpm-lock.yaml). Si no está instalado, lo activamos
# vía corepack, que ya viene con Node >= 16.13. Esto evita depender de que
# cada máquina tenga pnpm instalado manualmente (rol de Ops: "instalar el runtime").
if ! command -v pnpm >/dev/null 2>&1; then
  echo "==> pnpm no encontrado, habilitando via corepack..."
  corepack enable
  corepack prepare pnpm@latest --activate
fi

# --- 3. Instalar dependencias -----------------------------------------------
# --frozen-lockfile falla si el lockfile no coincide con package.json, en vez
# de reescribirlo. Es lo que queremos en un deploy: dependencias reproducibles.
echo "==> Instalando dependencias..."
pnpm install --frozen-lockfile

# --- 4. Correr tests (opcional pero recomendado antes de desplegar) --------
echo "==> Corriendo tests..."
pnpm test

# --- 5. Compilar el proyecto -------------------------------------------------
# "nest build" compila TypeScript -> JavaScript en la carpeta dist/.
echo "==> Compilando (nest build)..."
pnpm run build

# --- 6. Abrir el puerto en el firewall --------------------------------------
# Esta es la parte que faltaba: el taller exige que el firewall del SO esté
# activo bloqueando todo, salvo el puerto explícito del backend. Cada rama usa
# la herramienta nativa del SO detectado en el paso 1.
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
    # netsh es un binario de Windows accesible desde Git Bash. Se necesita
    # una terminal con permisos de Administrador para que el comando aplique.
    netsh advfirewall firewall add rule \
      name="backend-taller-ops1 ($PORT)" \
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
# start:prod corre "node dist/main". Lo dejamos corriendo en background
# (nohup) para que el script termine y Ops pueda seguir viendo logs con
# `tail -f deploy.log` y detener el proceso con `kill $(cat backend.pid)`.
# Cuando pasemos a Docker, este paso lo asume el CMD del Dockerfile.
echo "==> Levantando backend en el puerto $PORT..."
PORT="$PORT" nohup pnpm run start:prod > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "==> Backend desplegado. PID=$(cat "$PID_FILE") | Puerto=$PORT | Logs=$LOG_FILE (SO: $OS)."
