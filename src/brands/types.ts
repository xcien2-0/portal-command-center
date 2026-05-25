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
  odooUrl: string;       // "https://odoo.wispi.mx" for xcien
  odooDb: string;        // "wispi17" for xcien
  emailDomain: string;   // "xcien.com" for xcien
  orgName: string;       // full org name for org chart root
  scannerLabel: string;  // "XCIEN Scanner"
  nocLabel: string;      // "XCIEN NOC"
}
