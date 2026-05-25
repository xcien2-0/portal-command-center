import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import brand from "./brand";

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
