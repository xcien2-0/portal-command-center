export interface BrandConfig {
  id: string;
  name: string;          // Nombre corto: "XCIEN", "Consorcio", "PSI México"
  version: string;       // "2.0"
  tagline: string;       // Subtítulo del portal
  logo: string;          // Ruta al logo en /public
  favicon: string;       // Ruta al favicon en /public
  accentColor: string;   // Color de acento principal
  adminLabel: string;    // "Admin XCIEN", "Admin Consorcio", etc.
  academiaLabel: string; // "XCIEN Academia", etc.
  appTitle: string;      // Título del <title> en el HTML
  appDescription: string;
}
