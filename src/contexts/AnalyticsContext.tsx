/**
 * Analytics Context — captura automática de uso, navegación y clicks.
 * Envía eventos en batch al backend cada 15 segundos o al acumular 20 eventos.
 */
import { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API = '/api/analytics/events';
const BATCH_INTERVAL_MS = 15_000;
const BATCH_MAX         = 20;

export type EventName =
  | 'session_start' | 'session_end'
  | 'section_view'  | 'section_leave'
  | 'click'         | 'search'
  | 'filter_change' | 'export'
  | 'error'         | 'api_error';

interface AnalyticsCtx {
  track: (event: EventName, properties?: Record<string, unknown>) => void;
  trackSection: (section: string, durationMs?: number, fromSection?: string) => void;
}

const Ctx = createContext<AnalyticsCtx>({ track: () => {}, trackSection: () => {} });

function makeSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user }     = useAuth();
  const sessionId    = useRef(makeSessionId());
  const queue        = useRef<object[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSec   = useRef<string>('');
  const secStart     = useRef<number>(Date.now());

  const flush = useCallback(() => {
    if (queue.current.length === 0) return;
    const batch = queue.current.splice(0);
    // fire-and-forget — no bloqueamos el UI
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const enqueue = useCallback((event: EventName, section: string, properties: Record<string, unknown> = {}) => {
    queue.current.push({
      ts:          new Date().toISOString(),
      session_id:  sessionId.current,
      user_id:     user?.id     ?? null,
      user_email:  user?.email  ?? null,
      user_nombre: user?.nombre ?? null,
      rol:         user?.rol    ?? null,
      event,
      section,
      properties,
    });
    if (queue.current.length >= BATCH_MAX) flush();
  }, [user, flush]);

  const track = useCallback((event: EventName, properties: Record<string, unknown> = {}) => {
    enqueue(event, currentSec.current, properties);
  }, [enqueue]);

  const trackSection = useCallback((section: string, durationMs?: number, fromSection?: string) => {
    const now = Date.now();
    const dur  = durationMs ?? (now - secStart.current);

    // Dejar constancia de la salida de la sección anterior
    if (currentSec.current && currentSec.current !== section) {
      enqueue('section_leave', currentSec.current, { duration_ms: dur, to_section: section });
    }

    currentSec.current = section;
    secStart.current   = now;

    enqueue('section_view', section, {
      from_section: fromSection ?? null,
      duration_prev_ms: dur,
    });
  }, [enqueue]);

  // Session start
  useEffect(() => {
    if (!user) return;
    enqueue('session_start', 'app', { user_agent: navigator.userAgent });
    return () => {
      const dur = Date.now() - secStart.current;
      enqueue('section_leave', currentSec.current, { duration_ms: dur });
      enqueue('session_end', 'app', { session_duration_ms: Date.now() - parseInt(sessionId.current) });
      flush();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Batch timer
  useEffect(() => {
    timerRef.current = setInterval(flush, BATCH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      flush();
    };
  }, [flush]);

  // Flush on page hide (tab close, navigation)
  useEffect(() => {
    const handler = () => flush();
    window.addEventListener('visibilitychange', handler);
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('visibilitychange', handler);
      window.removeEventListener('beforeunload', handler);
    };
  }, [flush]);

  return <Ctx.Provider value={{ track, trackSection }}>{children}</Ctx.Provider>;
}

export const useAnalytics = () => useContext(Ctx);
