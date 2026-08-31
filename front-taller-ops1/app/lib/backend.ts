// Solo debe importarse desde código que corre en el servidor (Route Handlers
// bajo app/api/**). A diferencia de NEXT_PUBLIC_BACKEND_URL, esta variable
// NUNCA se hornea en el bundle del navegador: se lee en cada request, en
// tiempo de ejecución, desde el proceso Node de "next start".
//
// Dentro de docker-compose, esto resuelve a "http://backend:5000" por nombre
// de servicio en la red interna. En local (pnpm dev, sin Docker), cae al
// valor por defecto localhost:5000.
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";
