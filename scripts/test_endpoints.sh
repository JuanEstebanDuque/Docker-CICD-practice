#!/usr/bin/env bash
set -euo pipefail

# --- 0. Configuración -------------------------------------------------------
# Este script asume que el stack YA está corriendo (docker compose up),
# no lo levanta él mismo. Permite sobreescribir las URLs por variable de
# entorno si algún día se corre contra otras direcciones.
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

fail() {
  echo "FALLÓ: $1"
  exit 1
}

# --- 1. Esperar a que el backend esté listo ---------------------------------
# Justo después de "docker compose up -d", Nest puede tardar un instante en
# aceptar conexiones. Reintentamos con espera en vez de fallar al primer
# intento.
echo "==> Esperando a que el backend responda en $BACKEND_URL/health..."
READY=false
for i in $(seq 1 30); do
  if curl -sf "$BACKEND_URL/health" > /dev/null 2>&1; then
    READY=true
    break
  fi
  sleep 1
done

if [ "$READY" != true ]; then
  fail "el backend no respondió tras 30 intentos (30s)"
fi
echo "    Backend listo."

# --- 2. HU5: /health responde "ok" ------------------------------------------
echo "==> GET /health"
HEALTH_BODY="$(curl -sf "$BACKEND_URL/health")"
echo "$HEALTH_BODY" | grep -q '"status":"ok"' || fail "/health no devolvió status ok ($HEALTH_BODY)"

# --- 3. HU1: /sum calcula bien ------------------------------------------------
echo "==> POST /sum (2 + 3 = 5)"
SUM_BODY="$(curl -sf -X POST "$BACKEND_URL/sum" \
  -H "Content-Type: application/json" \
  -d '{"a":2,"b":3}')"
echo "$SUM_BODY" | grep -q '"result":5' || fail "/sum no devolvió 5 ($SUM_BODY)"

# --- 4. HU4: /divide entre 0 responde 400 -------------------------------------
echo "==> POST /divide entre 0 (debe responder 400)"
DIVIDE_STATUS="$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/divide" \
  -H "Content-Type: application/json" \
  -d '{"a":10,"b":0}')"
[ "$DIVIDE_STATUS" = "400" ] || fail "/divide entre 0 esperaba 400, devolvió $DIVIDE_STATUS"

# --- 5. HU3: /history responde ------------------------------------------------
echo "==> GET /history"
curl -sf "$BACKEND_URL/history?limit=5" > /dev/null || fail "/history no respondió"

# --- 6. Frontend sirve HTML ----------------------------------------------------
echo "==> GET frontend /"
curl -sf "$FRONTEND_URL/" > /dev/null || fail "el frontend no respondió en /"

echo "==> Todos los endpoints respondieron correctamente."
