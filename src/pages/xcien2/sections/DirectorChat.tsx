import { useState, useRef, useEffect, useCallback } from 'react';
import { ThemeConfig, ChatMessage } from '../types';

// ── Simulated AI responses ────────────────────────────────────────────────────
const RESPONSES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ['red', 'noc', 'latencia', 'nodo', 'alerta'],
    reply: 'La red opera al **98.7% de salud global**. El nodo crítico activo es `COAH-SALTILLO-CORE` con 210ms de latencia y pérdida de paquetes del 5.2%. Tengo 2 alertas críticas sin ticket asignado. ¿Deseas que genere un ticket de emergencia?',
  },
  {
    keywords: ['academia', 'técnico', 'capacitación', 'nivel', 'badge'],
    reply: 'Academia XCIEN: **47 técnicos activos**, avance global del **62.3%**. El top técnico es Brian Quintero Choreño con 100% y 12 badges. Quedan 8 técnicos en nivel Aprendiz que requieren plan de acción. ¿Quieres el reporte completo?',
  },
  {
    keywords: ['dispatch', 'campo', 'técnico', 'wfm', 'ticket'],
    reply: 'Operaciones de campo — Abril 2026: **411 tareas**, **24% cumplimiento global**. SANDUR con 316 tareas es el ISP con mayor backlog. Tengo 3 técnicos disponibles en Nuevo León para asignación inmediata. ¿Asigno los tickets pendientes?',
  },
  {
    keywords: ['ingreso', 'mrr', 'revenue', 'factura', 'cobranza'],
    reply: 'MRR actual: **$102,500 MXN**. ARR proyectado **$1.23M**. Cuentas por cobrar vencidas: $47,200 (12 facturas). Tasa de cobranza en 94.2% — superior al mes anterior en 2.1pp. ¿Genero el reporte ejecutivo para Gerencia?',
  },
  {
    keywords: ['hola', 'buenos', 'buenas', 'hey', 'hi'],
    reply: 'Hola. Soy el **Director General IA** de XCIEN 2.0. Tengo acceso en tiempo real a Red, Operaciones de Campo, Academia y Finanzas. ¿En qué área necesitas apoyo hoy?',
  },
];

const FALLBACK_REPLY =
  'Entendido. Consultando datos del sistema... Con base en el estado actual de las operaciones, te recomiendo revisar el módulo de **NOC** para el estado de red y **WFM** para la asignación de campo. ¿Quieres que profundice en algún área específica?';

function getReply(input: string): string {
  const lower = input.toLowerCase();
  for (const { keywords, reply } of RESPONSES) {
    if (keywords.some(k => lower.includes(k))) return reply;
  }
  return FALLBACK_REPLY;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px;font-size:0.9em">$1</code>');
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { theme: ThemeConfig }

export default function DirectorChat({ theme }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: 'Sistema operacional. Soy el **Director General IA** — tengo acceso a red, campo, academia y finanzas. ¿En qué puedo ayudarte?',
      ts: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;

    const ts = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text, ts };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = getReply(text);
      const botMsg: ChatMessage = { id: `b-${Date.now()}`, role: 'assistant', content: reply, ts };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 600);
  }, [input, isTyping]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const accent = theme.accent;
  const accentGlow = `${accent}30`;

  return (
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
              color: theme.text,
              fontSize: 13,
              outline: 'none',
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
  );
}
