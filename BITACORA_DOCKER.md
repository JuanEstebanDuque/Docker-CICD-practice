# Bitácora — Bloque 1: Contenerización con Docker (Taller 3)

Registro de qué se hizo, por qué, y qué problemas salieron en el camino, para repasar antes de sustentar.

## 1. Dockerfile del backend (`backend-taller-ops1/Dockerfile`)

**Build multi-stage** (`builder` + `production`):
- `builder`: instala TODAS las dependencias (`pnpm install --frozen-lockfile`, incluye devDependencies como TypeScript) y corre `pnpm run build` (`nest build` → genera `dist/`).
- `production`: imagen nueva y limpia, instala solo `dependencies` (`pnpm install --frozen-lockfile --prod`), y copia únicamente `dist/` desde `builder` con `COPY --from=builder`.

**Por qué multi-stage**: la imagen final no carga con TypeScript, `@nestjs/cli`, jest, etc. — solo lo necesario para correr `node dist/main`. Resultado: imagen más liviana y con menor superficie.

**Decisiones de imagen base**:
- `node:22-alpine` (no `node:20`): el pnpm local del equipo es 11.3.0, que exige Node ≥22.13. Con Node 20 el build fallaba con `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.
- `corepack prepare pnpm@11.3.0 --activate` (no solo `corepack enable`): fija la versión exacta de pnpm, igual a la que usa el equipo localmente. Sin esto, corepack baja la última versión de pnpm disponible el día del build, lo que puede romper la reproducibilidad entre builds de distintas PCs.

**`--frozen-lockfile`**: falla el build si `pnpm-lock.yaml` no coincide con `package.json`, en vez de reescribir el lockfile silenciosamente. Es lo que se quiere en CI/CD: si falla por esto, es señal de que alguien olvidó correr `pnpm install` tras tocar dependencias.

**`.dockerignore`**: excluye `node_modules`, `dist`, `coverage`, `data`, `*.log`, `*.pid`, `.git`, `.env*` del contexto de build.

**Equivalencia con `deploy.sh`**: los pasos de instalar dependencias y compilar se mantienen (`RUN`); el arranque (`pnpm run start:prod` = `node dist/main`) se convierte en `CMD`. Lo que **no** se traduce al Dockerfile: detección de SO, apertura de firewall (`ufw`/`netsh`), gestión de PID/`nohup`, detección de IP LAN — son responsabilidades del host o que Docker resuelve solo (ciclo de vida del proceso, `restart:`, `ports:`).

## 2. Dockerfile del frontend (`front-taller-ops1/Dockerfile`)

Mismo patrón multi-stage y misma imagen base (`node:22-alpine` + pnpm 11.3.0 pineado).

**Diferencias específicas de Next.js**:
- El build de Next genera `.next/`, no `dist/` (error inicial: se copió `dist/` por copiar el patrón del backend sin ajustar).
- La etapa `production` necesita copiar además `public/` (assets estáticos) y `next.config.ts`, porque `next start` los lee en tiempo de ejecución.
- `CMD ["pnpm", "start"]` (equivalente a `next start`, como en `deploy.sh`).

**Bug encontrado y corregido**: `.dockerignore` del frontend estaba **vacío**. Esto hacía que `COPY . .` copiara el `node_modules` local de Windows encima del que se había instalado limpio dentro del contenedor Linux, y `pnpm run build` fallaba con `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` (pnpm detectaba la inconsistencia y pedía confirmación interactiva para purgar `node_modules`, imposible dentro de un build no interactivo). Se corrigió agregando `node_modules`, `.next`, `.git`, `.env*`, etc.

## 3. Refactor de arquitectura: de llamadas directas del navegador a un patrón BFF (Backend for Frontend)

**Problema de partida**: `app/lib/api.ts` usaba `NEXT_PUBLIC_BACKEND_URL`, horneada en el bundle en build time (`ARG`/`ENV` + `next build`). Pero los componentes que la usan (`Calculator.tsx`, `History.tsx`, `HealthBadge.tsx`) son **Client Components** (`"use client"`) — el `fetch` corre en el navegador. El navegador vive fuera de la red de Docker (`calc-net`), así que nunca podría resolver un hostname interno como `backend` — solo `localhost` o una IP real.

**Decisión tomada**: mover las llamadas al backend hacia el **servidor** de Next, usando Route Handlers como intermediario (patrón BFF). Esto habilita comunicación por nombre de servicio de Docker, que es justo lo que pide el taller ("resolver por nombre de servicio, evitando IPs fijas").

**Alternativas consideradas y descartadas**:
- *Server Actions* (`"use server"`): mismo resultado de fondo (el servidor hace el fetch), pero el manejo de errores es por excepciones, no por status codes HTTP — no encajaba con el formato de error ya construido en `api.ts` (`statusCode`/`error`/`message`).
- *Server Components* puros: no pueden manejar eventos de click (`onSubmit`), no sirven para la calculadora interactiva.

**Cómo quedó**:
- `app/lib/backend.ts` (nuevo): exporta `BACKEND_URL` leída de `process.env.BACKEND_URL` — **sin** prefijo `NEXT_PUBLIC_`, por lo que nunca se hornea en el bundle; se lee en cada request, en el servidor.
- `app/api/calc/[operation]/route.ts` (ruta dinámica, nuevo): reemplaza los 4 endpoints (`sum`/`subtract`/`multiply`/`divide`) con un solo archivo. Valida la operación, reenvía el body al backend (`fetch(`${BACKEND_URL}/${operation}`)`), y devuelve la misma respuesta y el mismo status code que dio Nest (importante para que los 400 de división por cero sigan funcionando).
- `app/api/history/route.ts` (nuevo): proxy a `GET /history`.
- `app/api/health/route.ts` (nuevo): proxy a `GET /health` (espeja el shape crudo que espera `fetchBackendHealth`).
- `app/api/status/route.ts` (ya existía): se corrigió su import de `BACKEND_URL` para que venga de `backend.ts` en vez de `api.ts`.
- `app/lib/api.ts`: se eliminó el export `BACKEND_URL`; los `fetch` ahora usan rutas **relativas** (`/api/calc/sum`, `/api/history`, `/api/health`) en vez de URLs absolutas al backend.

**Flujo resultante (dos saltos de red)**:
1. Navegador → `fetch("/api/calc/sum")` → mismo origen, llega al servidor de Next dentro del contenedor `frontend`.
2. Servidor de Next → `fetch("http://backend:5000/sum")` → dentro de `calc-net`, resuelve por nombre de servicio.

**Pendiente / decisión abierta del usuario**: `fetchBackendHealth()` en `api.ts` quedó sin ningún llamador (`HealthBadge.tsx` ya hacía su propio `fetch("/api/status")` aparte). Se dejó así a propósito — decidir después si se elimina o si `HealthBadge` pasa a usarla para ser consistente con el resto.

## 4. `docker-compose.yml` (raíz del repo)

```yaml
services:
  backend:
    build: { context: ./backend-taller-ops1 }
    ports: ["5000:5000"]
    volumes: ["./backend-taller-ops1/data:/app/data"]
    networks: [calc-net]
  frontend:
    build: { context: ./front-taller-ops1 }
    environment:
      - BACKEND_URL=http://backend:5000
    ports: ["3000:3000"]
    depends_on: [backend]
    networks: [calc-net]
networks:
  calc-net: { driver: bridge }
```

**Decisiones**:
- **Bind mount** (`./backend-taller-ops1/data:/app/data`) en vez de volumen nombrado: el historial (`history.json`, HU3) queda visible/editable directo en el disco del host, útil para depurar; sobrevive a `docker compose down` y a reconstrucciones de imagen.
- **Red explícita `calc-net`** (en vez de dejar la red default de Compose sin nombrar): deja claro en el archivo que existe una red interna compartida, como pide el enunciado del taller.
- **`BACKEND_URL` va como variable de entorno de runtime (`environment:`), no como `build.args`**: como ahora se lee en el servidor en cada request (no se hornea en build time), no hace falta reconstruir la imagen si cambia — solo cambiar el valor y `docker compose up -d`. Esto es distinto del enfoque anterior (`NEXT_PUBLIC_BACKEND_URL` vía `ARG`), que sí exigía rebuild.
- Aquí `http://backend:5000` sí funciona, porque quien la lee (las Route Handlers) corre dentro de `calc-net`, a diferencia del navegador.

## 5. Problemas de entorno resueltos en el camino (no relacionados con el código)

- **Puerto 5000 "ocupado"**: un proceso `node.exe` local (dejado corriendo por una ejecución anterior de `deploy.sh` en background, vía `nohup`) seguía escuchando en el puerto 5000 de Windows. Se identificó con `netstat -ano | findstr :5000` + `tasklist /FI "PID eq <pid>"`, y se terminó con `taskkill /PID <pid> /F`. Nota: el PID que guarda `backend.pid` (vía `$!` en Git Bash) no siempre coincide con el PID real que ve Windows — hay que verificar con `netstat`/`tasklist`, no confiar ciegamente en el archivo `.pid`.
- **`docker run` sin publicar el puerto**: correr un contenedor sin `-p <host>:<contenedor>` deja el puerto solo accesible dentro del contenedor; `EXPOSE` en el Dockerfile es documentación, no publica nada por sí solo.
- **Conflictos de nombre de contenedor**: `docker-compose.yml` fija `container_name: calc-backend`/`calc-frontend`; si ya existían contenedores manuales (`docker run --name calc-backend ...`) de pruebas anteriores, Compose no puede reusar el nombre y falla con "Conflict". Se resuelve identificando el contenedor viejo (`docker ps -a --filter name=...`) y borrándolo (`docker rm <nombre>`) antes de `docker compose up`.
- **Docker Desktop agrupa contenedores de Compose bajo una fila de "proyecto"** (nombrada por la carpeta del repo), colapsable con la flecha `>` — no es un contenedor nuevo ni misterioso, es la agrupación visual del stack completo. `docker compose ps` desde terminal es la forma confiable de ver qué hay realmente corriendo.

## 6. Estado actual y qué falta del taller

- ✅ Bloque 1 (Docker/Compose): backend y frontend contenerizados, comunicándose por red interna, con volumen persistente.
- ⏳ Bloque 2: `.github/workflows/ci.yml` con jobs `build` y `test` en `ubuntu-latest`.
- ⏳ Bloque 3: runner autoalojado, conexión SSH entre PCs Ops, `deploy.sh` de entrega remota.
- ⏳ Bloque 4: verificación cruzada / monitoreo centralizado por el docente.
