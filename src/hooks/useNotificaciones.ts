import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../config';

export type NotiTipo = 'noc_critica' | 'wfm_urgente' | 'kpi_alerta' | 'academia' | 'sistema';

export interface Notificacion {
  id: string;
  tipo: NotiTipo;
  titulo: string;
  cuerpo: string;
  ts: number;       // epoch ms
  leida: boolean;
  link?: string;    // SectionId del portal
  extra?: Record<string, unknown>;
}

const STORAGE_KEY = 'xcien_notificaciones';
const READ_KEY    = 'xcien_notif_leidas';
const MAX_NOTIFS  = 80;

function loadPersistedNotifs(): Notificacion[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistNotifs(notifs: Notificacion[]) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFS))); } catch {}
}

function loadLeidas(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function persistLeidas(leidas: Set<string>) {
  try {
    const arr = Array.from(leidas).slice(-200);
    localStorage.setItem(READ_KEY, JSON.stringify(arr));
  } catch {}
}

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(loadPersistedNotifs);
  const leidasRef = useRef<Set<string>>(loadLeidas());
  const esRef     = useRef<EventSource | null>(null);

  // Apply leidas state to notifications
  const applyLeidas = useCallback((notifs: Notificacion[]): Notificacion[] =>
    notifs.map(n => ({ ...n, leida: leidasRef.current.has(n.id) })),
    []
  );

  const pushNotif = useCallback((raw: Omit<Notificacion, 'leida'>) => {
    setNotificaciones(prev => {
      // Dedup por id
      if (prev.some(n => n.id === raw.id)) return prev;
      const nuevo: Notificacion = { ...raw, leida: leidasRef.current.has(raw.id) };
      const next = [nuevo, ...prev].slice(0, MAX_NOTIFS);
      persistNotifs(next);
      return next;
    });
  }, []);

  // SSE connection
  useEffect(() => {
    const token = localStorage.getItem('xcien_token');
    if (!token) return;

    const url = `${API_BASE}/api/notificaciones/stream?token=${encodeURIComponent(token)}`;
    let es: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;
    let alive = true;

    function connect() {
      if (!alive) return;
      es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.tipo === 'ping') return;
          pushNotif(data as Omit<Notificacion, 'leida'>);

          // Desktop notification if permitted
          if (Notification.permission === 'granted' && !leidasRef.current.has(data.id)) {
            new Notification(`XCIEN · ${data.titulo}`, { body: data.cuerpo, icon: '/favicon.ico' });
          }
        } catch {}
      };

      es.onerror = () => {
        es.close();
        if (alive) retryTimer = setTimeout(connect, 8000);
      };
    }

    connect();

    return () => {
      alive = false;
      clearTimeout(retryTimer);
      esRef.current?.close();
    };
  }, [pushNotif]);

  const marcarLeida = useCallback((id: string) => {
    leidasRef.current.add(id);
    persistLeidas(leidasRef.current);
    setNotificaciones(prev => {
      const next = prev.map(n => n.id === id ? { ...n, leida: true } : n);
      persistNotifs(next);
      return next;
    });
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones(prev => {
      prev.forEach(n => leidasRef.current.add(n.id));
      persistLeidas(leidasRef.current);
      const next = prev.map(n => ({ ...n, leida: true }));
      persistNotifs(next);
      return next;
    });
  }, []);

  const limpiar = useCallback(() => {
    setNotificaciones([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return { notificaciones: applyLeidas(notificaciones), noLeidas, marcarLeida, marcarTodasLeidas, limpiar };
}
