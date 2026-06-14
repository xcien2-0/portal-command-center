import { useState, useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '../types';
import { useAuth } from '@/contexts/AuthContext';

interface WarRoomSectionProps { theme: ThemeConfig; }

interface Message {
  id: string;
  agent: string;
  label: string;
  text: string;
  color: string;
  ts: string;
  typing?: boolean;
}

const AGENTS: Record<string, { label: string; color: string; emoji: string }> = {
  director:  { label: 'Director General', color: '#FFB703', emoji: '🎯' },
  noc:       { label: 'NOC Agent',        color: '#FF6B6B', emoji: '📡' },
  wfm:       { label: 'WFM Agent',        color: '#00B4D8', emoji: '🔧' },
  academia:  { label: 'Academia Agent',   color: '#34D399', emoji: '🎓' },
};

// Agentes que responden en secuencia tras el director
const PANEL_AGENTS = ['noc', 'wfm', 'academia'] as const;

// Elige los 2 agentes más relevantes según keywords del comando
function pickAgents(cmd: string): string[] {
  const c = cmd.toLowerCase();
  const scores: Record<string, number> = { noc: 0, wfm: 0, academia: 0 };
  if (/red|nodo|switch|latencia|alerta|monitoreo|ping|falla de red|bgp|fibra/.test(c)) scores.noc += 3;
  if (/ticket|técnico|dispatch|orden|campo|instalac|manten|ruta|bidrilla/.test(c)) scores.wfm += 3;
  if (/curso|certificac|capacitac|técnico|academia|examen|módulo|nivel/.test(c)) scores.academia += 3;
  // genérico — si no hay keywords claras, usar noc + wfm como default
  const sorted = (Object.keys(scores) as (keyof typeof scores)[]).sort((a, b) => scores[b] - scores[a]);
  const picks = sorted.filter(k => scores[k] > 0).slice(0, 2);
  return picks.length > 0 ? picks : ['noc', 'wfm'];
}

function ts() { return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }

export default function WarRoomSection({ theme }: WarRoomSectionProps) {
  const { authFetch } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addTyping = useCallback((agent: string) => {
    const id = `typing-${agent}`;
    setMessages(prev => [...prev, { id, agent, label: AGENTS[agent].label, text: '', color: AGENTS[agent].color, ts: ts(), typing: true }]);
    return id;
  }, []);

  const replaceTyping = useCallback((id: string, text: string, agent: string) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, text, typing: false } : m
    ));
    void agent; // used to capture in closure
  }, []);

  const callAgent = useCallback(async (agentId: string, message: string, history: Array<{role:string;content:string}>) => {
    const typingId = addTyping(agentId);
    try {
      const res = await authFetch('/api/agentes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agente_id: agentId, message, history }),
      });
      const data = await res.json();
      const text = data.response ?? 'Sin respuesta.';
      replaceTyping(typingId, text, agentId);
      return text;
    } catch {
      replaceTyping(typingId, '⚠️ Error conectando con el agente.', agentId);
      return '';
    }
  }, [authFetch, addTyping, replaceTyping]);

  const handleSend = useCallback(async () => {
    const cmd = inputVal.trim();
    if (!cmd || busy) return;

    setInputVal('');
    setBusy(true);

    // 1. Mensaje del usuario
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      agent: 'user',
      label: 'Operador',
      text: cmd,
      color: '#8B9CBD',
      ts: ts(),
    };
    setMessages(prev => [...prev, userMsg]);

    const history = [{ role: 'user', content: cmd }];

    // 2. Director responde primero
    const dirResponse = await callAgent('director', cmd, history);
    history.push({ role: 'assistant', content: dirResponse });

    // 3. Agentes del panel responden en paralelo (los 2 más relevantes)
    const panelAgentIds = pickAgents(cmd);
    const panelPrompt = `Contexto de la sala de guerra:\n\nOperador: ${cmd}\nDirector: ${dirResponse}\n\nDa tu perspectiva técnica en máx 3 oraciones.`;

    await Promise.all(
      panelAgentIds.map(agentId => callAgent(agentId, panelPrompt, []))
    );

    setBusy(false);
    inputRef.current?.focus();
  }, [inputVal, busy, callAgent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', gap: 12 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#FFB703', margin: 0 }}>⚔️ SALA DE GUERRA — ORQUESTACIÓN REAL</h2>
            <p style={{ fontSize: 12, color: theme.dim, margin: '4px 0 0' }}>Los agentes responden con inteligencia real de XCIEN · Claude Sonnet</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(AGENTS).map(([id, a]) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: `${a.color}12`, border: `1px solid ${a.color}30` }}>
                <span style={{ fontSize: 10 }}>{a.emoji}</span>
                <span style={{ fontSize: 10, color: a.color, fontWeight: 700 }}>{a.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ fontSize: 36 }}>⚔️</div>
            <p style={{ color: theme.dim, fontSize: 14, textAlign: 'center', maxWidth: 440, lineHeight: 1.6 }}>
              Escribe una situación de operaciones y el panel de agentes responderá con inteligencia real.<br />
              <span style={{ color: '#FFB70380', fontSize: 12 }}>Ej: "Degradación en nodo Saltillo-Sur, 5 clientes VIP afectados"</span>
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                'Falla crítica en fibra Monterrey Norte',
                '3 técnicos sin asignación en Saltillo',
                'Certificaciones vencidas en el equipo de campo',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => setInputVal(s)}
                  style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,183,3,0.08)', border: '1px solid rgba(255,183,3,0.2)', color: '#FFB703', fontSize: 12, cursor: 'pointer' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => {
          const isUser = m.agent === 'user';
          return (
            <div
              key={m.id}
              style={{
                padding: '12px 16px',
                background: isUser ? `rgba(139,156,189,0.06)` : `${m.color}08`,
                border: `1px solid ${isUser ? 'rgba(139,156,189,0.15)' : `${m.color}20`}`,
                borderRadius: 12,
                marginLeft: isUser ? 40 : 0,
                marginRight: isUser ? 0 : 40,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10 }}>{AGENTS[m.agent]?.emoji ?? '👤'}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: m.color, letterSpacing: '0.05em' }}>
                  {m.label.toUpperCase()}
                </span>
                <span style={{ fontSize: 10, color: theme.dim, marginLeft: 'auto' }}>{m.ts}</span>
              </div>
              {m.typing ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 20 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: m.color,
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.text}</div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        background: '#0e1118', border: `2px solid ${busy ? '#FFB70360' : '#FFB703'}`,
        borderRadius: 12, padding: '14px 18px',
        boxShadow: `0 0 20px #FFB70318`,
        flexShrink: 0, transition: 'border-color 0.2s',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#FFB703', marginBottom: 8, letterSpacing: '0.1em' }}>
          {busy ? 'AGENTES PROCESANDO...' : 'ENVIAR ORDEN AL PANEL'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#FFB703', fontSize: 18, fontWeight: 900 }}>{'>'}</span>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            placeholder="Da una orden o describe una situación crítica..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: '#fff', outline: 'none', fontSize: 15,
              fontFamily: 'monospace', opacity: busy ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={busy || !inputVal.trim()}
            style={{
              padding: '6px 16px', borderRadius: 8,
              background: busy || !inputVal.trim() ? 'rgba(255,183,3,0.15)' : '#FFB703',
              border: 'none', color: busy ? '#FFB70380' : '#0a0800',
              fontSize: 12, fontWeight: 700, cursor: busy || !inputVal.trim() ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {busy ? '...' : 'Enviar'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
