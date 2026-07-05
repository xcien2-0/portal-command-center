import { useCallback } from 'react';
import { useAnalytics } from '../contexts/AnalyticsContext';

/**
 * Devuelve una función para registrar cambios de pestaña/vista dentro de una sección.
 * Uso: const trackTab = useTabTrack('noc');
 *      trackTab('alertas');
 */
export function useTabTrack(sectionId: string) {
  const { track } = useAnalytics();
  return useCallback(
    (tab: string, extra?: Record<string, unknown>) => {
      track('click', { action: 'tab_change', section: sectionId, tab, ...extra });
    },
    [track, sectionId],
  );
}

/**
 * Registra una acción clave dentro de una sección (búsqueda, filtro, exportar, etc.).
 */
export function useActionTrack(sectionId: string) {
  const { track } = useAnalytics();
  return useCallback(
    (action: string, extra?: Record<string, unknown>) => {
      track('click', { action, section: sectionId, ...extra });
    },
    [track, sectionId],
  );
}
