// Prioridad:
// 1. Variable de entorno VITE_API_URL (para producción en Vercel/Railway)
// 2. Ruta relativa — Vite proxea /api → backend en cualquier red (localhost, IP local, celular)
export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string) || '';
