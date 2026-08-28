import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config';

export interface PresenceUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

const PING_INTERVAL  = 20_000;  // enviar ping cada 20s
const POLL_INTERVAL  = 10_000;  // consultar otros cada 10s

export function usePresence(section: string): PresenceUser[] {
  const [others, setOthers] = useState<PresenceUser[]>([]);
  const sectionRef = useRef(section);
  sectionRef.current = section;

  const getToken = () => localStorage.getItem('xcien_token');

  const ping = useCallback((sec: string) => {
    const token = getToken();
    if (!token || !sec) return;
    fetch(`${API_BASE}/api/presence/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ section: sec }),
    }).catch(() => {});
  }, []);

  const leave = useCallback((sec: string) => {
    const token = getToken();
    if (!token || !sec) return;
    fetch(`${API_BASE}/api/presence/ping`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ section: sec }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const poll = useCallback((sec: string) => {
    const token = getToken();
    if (!token || !sec) return;
    fetch(`${API_BASE}/api/presence/active?section=${encodeURIComponent(sec)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setOthers(d.others ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!section) return;

    ping(section);
    poll(section);

    const pingTimer = setInterval(() => ping(sectionRef.current), PING_INTERVAL);
    const pollTimer = setInterval(() => poll(sectionRef.current), POLL_INTERVAL);

    return () => {
      clearInterval(pingTimer);
      clearInterval(pollTimer);
      leave(section);
      setOthers([]);
    };
  }, [section, ping, poll, leave]);

  return others;
}
