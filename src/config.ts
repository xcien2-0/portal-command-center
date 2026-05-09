const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Si estamos en desarrollo, apuntamos a localhost:8000. 
// En producción (servido por FastAPI), usamos rutas relativas.
export const API_BASE = IS_DEV ? 'http://localhost:8000' : '';
