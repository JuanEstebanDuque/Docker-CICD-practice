# Bloque 3 — Runner autoalojado + entrega por SSH

Guía para cuando actives esto en tu otra PC (la que va a actuar como PC Ops física en el salón). Este equipo actual **no** es esa máquina — esto es para seguir paso a paso allá.

## 1. Qué es un runner autoalojado (self-hosted runner)

Hasta ahora, tu `ci.yml` corre sus jobs en `ubuntu-latest` — una máquina virtual que **GitHub** te presta en su propia nube, temporal, que se destruye al terminar el job. Eso funciona para `build` y `test` porque no necesitan nada de tu red local.

Pero el job de despliegue del Bloque 3 sí necesita correr **físicamente dentro del salón**: tiene que poder hacer SSH hacia la PC del equipo par, algo que una VM en la nube de GitHub no puede alcanzar (no tiene ruta de red hacia tu router del salón). La solución: en vez de que GitHub te preste una máquina, **tú registras tu propia PC como "runner"** — un agente que se instala en tu equipo, se conecta hacia GitHub y queda escuchando "avísame cuando haya un job para mí". Cuando llega ese job, lo ejecuta ahí mismo, en tu PC, con acceso real a tu red local.

## 2. Registrar el runner (una vez por PC)

1. En GitHub, ve a tu repo → **Settings → Actions → Runners → New self-hosted runner**.
2. Elige el sistema operativo de esa PC (Windows/Linux). GitHub te genera un bloque de comandos con un **token temporal** (expira en poco tiempo, es de un solo uso para el registro) — cópialo tal cual, no lo reutilices de otra sesión vieja.
3. En esa PC, corre esos comandos. En resumen (Windows, PowerShell, como ejemplo — GitHub te da la versión exacta):
   ```powershell
   mkdir actions-runner ; cd actions-runner
   Invoke-WebRequest -Uri <URL-que-te-da-GitHub> -OutFile actions-runner.zip
   Expand-Archive -Path actions-runner.zip -DestinationPath .
   ./config.cmd --url https://github.com/<tu-usuario>/<tu-repo> --token <EL-TOKEN-QUE-TE-DIO-GITHUB>
   ```
4. Durante `config.cmd`, te pregunta por una **etiqueta** (label) — ponle algo identificable de tu equipo, ej. `equipo-A`. Esa etiqueta es la que usarás en el workflow para dirigir un job específicamente a esta PC (varios equipos del salón registran cada uno su propio runner con su propia etiqueta, todos contra el mismo repo o cada quien el suyo, según cómo lo organice el profesor).
5. Corre el runner: `./run.cmd` (deja la ventana abierta), o instálalo como servicio de Windows con `./svc.cmd install && ./svc.cmd start` para que quede corriendo en segundo plano sin depender de una terminal abierta — recomendado si vas a dejar la PC encendida sin supervisión.
6. Verifica en GitHub → Settings → Actions → Runners que aparezca como **"Idle"** (esperando trabajo) — eso confirma que la conexión funcionó.

## 3. Preparar el SSH entre las dos PCs de Ops

Esto es aparte del runner — es la conexión entre **tu PC** (donde corre el runner y `deploy-other.sh`) y **la PC del equipo par** (donde se despliega la app).

1. En tu PC (origen), genera un par de llaves si no tienes uno: `ssh-keygen -t ed25519 -C "equipo-A-deploy"` (dale Enter a todo para valores por defecto, o pon una passphrase si prefieres — para automatización en CI normalmente se deja vacía).
2. Copia la llave **pública** (`~/.ssh/id_ed25519.pub`, la que termina en `.pub` — nunca la privada) hacia la PC destino, dentro de `~/.ssh/authorized_keys` de esa máquina. Puedes hacerlo con `ssh-copy-id usuario@ip-destino` (si está disponible) o pegando el contenido a mano.
3. Prueba la conexión manual antes de automatizar nada: `ssh -i ~/.ssh/id_ed25519 usuario@ip-destino "hostname"` — si te pide contraseña en vez de conectar directo, la llave no quedó bien copiada.
4. Confirma que la PC destino tiene Docker Engine + el plugin de Compose instalados (responsabilidad del equipo par, según su propio Bloque 1) — sin eso, `deploy-other.sh` fallará en el paso `docker compose up -d --build` remoto, aunque el SSH funcione perfecto.

## 4. Cómo se conecta todo esto — "enviar el archivo" en la práctica

Aquí está la pieza que faltaba encadenar: **`deploy-other.sh` (ya creado en la raíz del repo) es justamente el archivo que "envía el archivo"** — no hay un paso separado de "copiar deploy-other.sh a otro lado". El flujo real es:

1. Haces `git push` a `master` (o se dispara por lo que definas).
2. El job `build` y `test` de `ci.yml` corren en la nube de GitHub, como ya vimos.
3. Agregarías un tercer job, `deploy`, que declaras así (mismo patrón del enunciado del taller):
   ```yaml
   deploy:
     needs: test
     runs-on: [self-hosted, equipo-A]
     steps:
       - uses: actions/checkout@v4
       - run: |
           export REMOTE_HOST=usuario@ip-del-equipo-par
           export SSH_KEY=/ruta/a/la/llave/privada
           ./deploy-other.sh
   ```
4. Como `runs-on: [self-hosted, equipo-A]` apunta a la etiqueta que registraste en el paso 2, GitHub **no** busca una VM en su nube para este job — le manda la orden a tu runner, que está físicamente en el salón. Tu runner hace `checkout` (trae el código más reciente) y luego corre `deploy-other.sh` **en tu propia PC**, con acceso real a la red local.
5. `deploy-other.sh` es el que literalmente "envía el archivo": empaqueta el proyecto con `tar` y lo manda por el túnel SSH hacia la PC del equipo par (visto en la sección 3 del script), y termina con `docker compose up -d --build` corriendo remoto allá.

**No agregues todavía este job `deploy` a `ci.yml`** — hazlo solo cuando el runner de esa PC esté registrado y en estado "Idle", y tengas el SSH probado manualmente (paso 3 de la sección 3). Si lo agregas antes, cada `push` dejará ese job esperando indefinidamente por un runner con la etiqueta `equipo-A` que aún no existe.

## 5. Checklist antes de dar por listo el Bloque 3

- [ ] Runner registrado y en estado "Idle" en GitHub → Settings → Actions → Runners.
- [ ] `ssh -i <llave> usuario@ip-destino "hostname"` conecta sin pedir contraseña.
- [ ] La PC destino tiene Docker Engine + Compose instalados y funcionando.
- [ ] `REMOTE_HOST=usuario@ip ./deploy-other.sh` corrido a mano una vez, exitoso.
- [ ] Job `deploy` agregado a `ci.yml` con `runs-on: [self-hosted, <tu-etiqueta>]`.
- [ ] Un `git push` completo dispara los tres jobs (`build` → `test` → `deploy`) y el equipo par ve la app corriendo en su PC.
