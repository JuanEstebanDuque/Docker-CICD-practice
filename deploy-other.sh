#!/usr/bin/env bash
set -euo pipefail

# --- 0. Configuración -------------------------------------------------------
# Este script corre en TU PC de Ops (la de origen) y despliega la app en la
# PC de Ops del equipo par, vía SSH. Es el equivalente, para el despliegue
# distribuido del Bloque 3, de lo que "docker compose up -d --build" hace
# localmente en el Bloque 1.
#
# REMOTE_HOST: usuario y IP/host de la PC destino, formato "usuario@ip".
#   Ej: REMOTE_HOST=ops@192.168.1.42 ./deploy-other.sh
# REMOTE_DIR: carpeta en la PC destino donde se copia el proyecto.
# SSH_KEY: llave privada a usar para autenticar (par de la llave pública
#   que ya debiste copiar a ~/.ssh/authorized_keys de la PC destino).
REMOTE_HOST="${REMOTE_HOST:?Debes definir REMOTE_HOST, ej: REMOTE_HOST=ops@192.168.1.42 ./deploy-other.sh}"
REMOTE_DIR="${REMOTE_DIR:-~/calc-app}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"

SSH_CMD=(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$REMOTE_HOST")

# --- 1. Verificar conectividad SSH ------------------------------------------
# Falla rápido y con un mensaje claro si la llave o el host están mal,
# en vez de que el primer error confuso salga en medio de la transferencia.
echo "==> Probando conexión SSH a $REMOTE_HOST..."
"${SSH_CMD[@]}" "echo '    Conectado OK a' \$(hostname)"

# --- 2. Crear la carpeta destino --------------------------------------------
"${SSH_CMD[@]}" "mkdir -p $REMOTE_DIR"

# --- 3. Transferir el código fuente y el docker-compose.yml -----------------
# Se empaqueta todo con tar y se manda por el mismo túnel SSH (tar | ssh | tar),
# en vez de copiar carpeta por carpeta con scp -r: es más rápido en LAN y
# permite excluir con --exclude lo que NO debe viajar (node_modules pesa
# cientos de MB y se reinstala igual en destino; .git no hace falta;
# dist/.next son builds locales que se regeneran con "docker compose build";
# data/ es el historial de HU3 y NO debe pisarse si el destino ya tiene uno).
echo "==> Empaquetando y enviando el proyecto a $REMOTE_HOST:$REMOTE_DIR..."
tar czf - \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='.next' \
  --exclude='backend-taller-ops1/data' \
  --exclude='*.log' \
  --exclude='*.pid' \
  . | "${SSH_CMD[@]}" "tar xzf - -C $REMOTE_DIR"

# --- 4. Levantar el stack remotamente ----------------------------------------
# Se reconstruye con "docker compose build" en LA MÁQUINA DESTINO (no se
# transfieren imágenes ya construidas): más simple, y evita depender de que
# ambas PCs tengan exactamente la misma arquitectura/versión de Docker para
# que una imagen pre-armada funcione igual.
echo "==> Levantando el stack remotamente (docker compose up -d --build)..."
"${SSH_CMD[@]}" "cd $REMOTE_DIR && docker compose up -d --build"

# --- 5. Verificación rápida post-despliegue ----------------------------------
echo "==> Verificando salud remota..."
"${SSH_CMD[@]}" "curl -sf http://localhost:5000/health && echo && curl -s -o /dev/null -w 'frontend: %{http_code}\n' http://localhost:3000/"

echo ""
echo "==> Despliegue remoto completado en $REMOTE_HOST:$REMOTE_DIR."
