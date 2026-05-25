/**
 * brand.ts — Selector de marca activa
 *
 * Para cambiar la marca de un repo, edita SOLO esta línea:
 *   import brand from './brands/xcien';      ← XCIEN
 *   import brand from './brands/consorcio';  ← Consorcio de Telecomunicaciones
 *   import brand from './brands/psimex';     ← PSI México
 *
 * O bien usa la variable de entorno VITE_BRAND en Vercel/Railway:
 *   VITE_BRAND=xcien | consorcio | psimex
 */

import xcien     from './brands/xcien';
import consorcio from './brands/consorcio';
import psimex    from './brands/psimex';
import type { BrandConfig } from './brands/types';

const brands: Record<string, BrandConfig> = { xcien, consorcio, psimex };

const active = (import.meta.env.VITE_BRAND as string) || 'xcien';

const brand: BrandConfig = brands[active] ?? xcien;

export default brand;
export type { BrandConfig };
