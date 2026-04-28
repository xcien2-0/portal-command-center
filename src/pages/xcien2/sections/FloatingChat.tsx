import { useState, useRef, useEffect, useCallback } from 'react';
import { ThemeConfig, ChatMessage } from '../types';
import { API_BASE } from '../../../config';

async function callDirectorAPI(message: string, history: {role: string, content: string}[]): Promise<string> {
  const res = await fetch(`${API_BASE}/api/director/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.response;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px;font-size:0.9em">$1</code>');
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { theme: ThemeConfig }

export default function FloatingChat({ theme }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: 'Sistema operacional. Soy el **Director General IA** — tengo acceso a red, campo, academia y finanzas. ¿En qué puedo ayudarte?',
      ts: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [bridgeData, setBridgeData] = useState<{ current_task: string; status: string; log: string[]; last_update: string }>({
    current_task: 'Inactivo', status: 'idle', log: [], last_update: ''
  });
  const endRef = useRef<HTMLDivElement>(null);

  // Polling for Antigravity Bridge
  useEffect(() => {
    const fetchBridge = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/bridge`);
        if (res.ok) setBridgeData(await res.json());
      } catch (e) { /* silent */ }
    };
    const id = setInterval(fetchBridge, 3000);
    fetchBridge();
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

const ts = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text, ts };

    // Compact history (last 4 msgs, ignore init)
    const historyToSend = messages
      .filter(m => m.id !== 'init')
      .slice(-4)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await callDirectorAPI(text, historyToSend);
      const botMsg: ChatMessage = { id: `b-${Date.now()}`, role: 'assistant', content: reply, ts };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ No se pudo conectar al backend. Verifica que el servidor esté corriendo en `localhost:8000`.',
        ts,
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const accent = theme.accent;
  const accentGlow = `${accent}30`;

  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      {isOpen && (
        <div style={{ width: 400, height: 650, background: '#0a0a0a', border: `1px solid ${theme.border}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, boxShadow: `0 0 10px ${accent}` }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Director General IA</h2>
          <span style={{ fontSize: 10, background: `${accent}18`, color: accent, border: `1px solid ${accent}30`, borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>EN LÍNEA</span>
        </div>
        <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>Agente de orquestación · acceso total al sistema XCIEN 2.0</p>
      </div>

      {/* Antigravity Bridge (Live Execution Feedback) */}
      <div style={{ 
        background: 'rgba(0,255,101,0.03)', 
        border: `1px dashed ${bridgeData.status === 'working' ? theme.accent : theme.border}`,
        borderRadius: theme.radius,
        padding: 10,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: theme.accent, letterSpacing: '0.05em' }}>📡 MASTER AGENT BRIDGE</span>
          <span style={{ fontSize: 9, color: theme.dim }}>{bridgeData.last_update}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>
          {bridgeData.status === 'working' ? ' trabajando en: ' : ' Estado: '}
          <span style={{ color: bridgeData.status === 'working' ? theme.accent : theme.text }}>{bridgeData.current_task}</span>
        </div>
        {bridgeData.log.length > 0 && (
          <div style={{ fontSize: 10, color: theme.dim, fontFamily: 'monospace', maxHeight: 40, overflowY: 'auto' }}>
            {bridgeData.log.slice(-1)[0]}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        background: '#111',
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}>
        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: theme.radius,
                  fontSize: 14,
                  lineHeight: 1.6,
                  background: msg.role === 'user' ? accent : theme.card,
                  color: msg.role === 'user' ? '#fff' : theme.text,
                  border: msg.role === 'assistant' ? `1px solid ${theme.border}` : 'none',
                  boxShadow: msg.role === 'user' ? `0 2px 12px ${accentGlow}` : 'none',
                }}
                dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
              />
              <span style={{ fontSize: 10, color: theme.dim, marginTop: 4, paddingInline: 4 }}>{msg.ts}</span>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, width: 'fit-content' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: accent,
                  animation: theme.animations ? `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite` : 'none',
                }} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding: 14, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Pregunta al Director General..."
            style={{
              flex: 1,
              background: '#1a1a1a',
              border: `1px solid ${theme.border}`,
              padding: '10px 16px',
              borderRadius: theme.radius,
              color: '#00FF65',
              fontWeight: '700',
              fontSize: '14px',
              outline: 'none',
              caretColor: '#00FF65'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            style={{
              width: 42, height: 42, borderRadius: theme.radius,
              background: input.trim() && !isTyping ? accent : '#333',
              border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
              color: '#fff', fontSize: 16, transition: 'background 0.2s',
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* Quick prompts */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {['Estado de red', 'Academia XCIEN', 'Operaciones de campo', 'Resumen ingresos'].map(q => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            style={{
              fontSize: 11, padding: '5px 12px', borderRadius: 20,
              background: 'transparent', border: `1px solid ${theme.border}`,
              color: theme.dim, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = accent; (e.target as HTMLElement).style.borderColor = accent; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = theme.dim; (e.target as HTMLElement).style.borderColor = theme.border; }}
          >
            {q}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes typing-dot {
          0%,60%,100% { transform:translateY(0); opacity:.4 }
          30%          { transform:translateY(-5px); opacity:1 }
        }
      `}</style>
    </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          width: 64, height: 64, borderRadius: 32, background: theme.accent, 
          color: '#fff', border: 'none', cursor: 'pointer', 
          boxShadow: `0 0 20px ${theme.accent}60`, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: 28,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>
    </div>
  );
}
