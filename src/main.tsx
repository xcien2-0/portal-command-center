import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import brand from "./brand";

// ── Inyección automática de Bearer token en todas las llamadas /api/* ──────────
// Evita modificar cada componente individualmente. Lee el token de localStorage
// en cada llamada para reflejar login/logout sin necesidad de re-montar.
(function patchFetchWithAuth() {
  const _orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL ? input.href : (input as Request).url;

    const isApiCall = url.startsWith('/api/') || url.includes('/api/');
    if (isApiCall) {
      const token = localStorage.getItem('xcien_token');
      if (token) {
        const headers = new Headers((init as RequestInit).headers);
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        init = { ...init, headers };
      }
    }
    return _orig(input, init);
  };
})();

// Aplicar metadatos de marca al documento
document.title = brand.appTitle;

const metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc) metaDesc.setAttribute('content', brand.appDescription);

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
if (favicon) {
  favicon.href = brand.favicon;
} else {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = brand.favicon;
  document.head.appendChild(link);
}

createRoot(document.getElementById("root")!).render(<App />);
