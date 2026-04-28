const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// En este ecosistema, el backend de Academia/Bridge siempre corre en el puerto 8000
export const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;
