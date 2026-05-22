const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Prioridad:
// 1. Variable de entorno VITE_API_URL (para producción en Vercel/Railway)
// 2. localhost:8002 en desarrollo local
// 3. Ruta relativa (cuando frontend y backend están en el mismo servidor)
export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string) ||
  (IS_DEV ? 'http://localhost:8002' : '');
