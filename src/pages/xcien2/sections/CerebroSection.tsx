import { useState, useEffect, useRef } from 'react';
import { ThemeConfig } from '../types';
import brand from '../../../brand';

interface Props { theme: ThemeConfig }

interface Provider {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'configured' | 'needs_key' | 'local' | 'online' | 'offline' | 'pending';
  models: string[];
  default_model: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  ts: string;
}

const CONTEXT_MODULES = [
  { id: 'noc',        label: 'NOC / Alertas',     icon: '🖥️'  },
  { id: 'wfm',        label: 'Campo WFM',          icon: '🔧'  },
  { id: 'inventario', label: 'Inventario',         icon: '📦'  },
  { id: 'ventas',     label: 'Ventas / MRR',       icon: '💰'  },
  { id: 'rrhh',       label: 'RRHH',               icon: '👤'  },
  { id: 'incidentes', label: 'Incidentes activos', icon: '🚨'  },
];

const STATUS_COLOR: Record<string, string> = {
  configured: '#22c55e',
  online:     '#22c55e',
  local:      '#a78bfa',
  needs_key:  '#f59e0b',
  offline:    '#6b7280',
  pending:    '#6b7280',
};

const STATUS_LABEL: Record<string, string> = {
  configured: 'Listo',
  online:     'Online',
  local:      'Local',
  needs_key:  'Falta key',
  offline:    'Offline',
  pending:    'Pendiente',
};

function uid() { return Math.random().toString(36).slice(2); }
function fmtTime(ts: string) {
  try { return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

export default function CerebroSection({ theme }: Props) {
  const G = theme.accent;
  const [providers, setProviders] = useState<Record<string, Provider>>({});
  const [activeProvider, setActiveProvider] = useState('ollama');
  const [activeModel, setActiveModel] = useState('llama3.2:3b');
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [showConfig, setShowConfig] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/cerebro/providers')
      .then(r => r.json())
      .then(data => {
        setProviders(data);
        const prov = data['claude'];
        if (prov) setActiveModel(prov.default_model);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const selectProvider = (id: string) => {
    const prov = providers[id];
    if (!prov || prov.status === 'pending' || prov.status === 'offline') return;
    setActiveProvider(id);
    setActiveModel(prov.default_model || prov.models[0] || '');
  };

  const toggleModule = (id: string) => {
    setActiveModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: uid(), role: 'user', content: text, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const r = await fetch('/api/cerebro/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          provider: activeProvider,
          model: activeModel,
          context_modules: activeModules,
          history,
          temperature,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: r.statusText }));
        throw new Error(err.detail || 'Error del servidor');
      }
      const data = await r.json();
      setMessages(prev => [...prev, {
        id: uid(), role: 'assistant',
        content: data.response,
        provider: data.provider,
        model: data.model,
        ts: new Date().toISOString(),
      }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setMessages(prev => [...prev, {
        id: uid(), role: 'assistant',
        content: `⚠️ Error: ${msg}`,
        ts: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  };

  const prov = providers[activeProvider];
  const provList = Object.values(providers);

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 100px)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
           style={{ borderColor: theme.border }}>
        <div>
          <h1 style={{ color: G }} className="text-xl font-bold leading-tight">
            🧠 Supercerebro Contextual
          </h1>
          <p style={{ color: theme.dim }} className="text-xs">
            Multi-proveedor · contexto operativo {brand.name} en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeModules.length > 0 && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${G}22`, color: G }}>
              {activeModules.length} módulo{activeModules.length > 1 ? 's' : ''} activo{activeModules.length > 1 ? 's' : ''}
            </span>
          )}
          <button onClick={() => setShowConfig(v => !v)}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.dim }}>
            ⚙️ Config
          </button>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.dim }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* ── Left panel: providers + modules ── */}
        <div className="flex-shrink-0 flex flex-col gap-3 p-3 border-r overflow-y-auto"
             style={{ width: 220, borderColor: theme.border, background: theme.sidebar }}>

          {/* Providers */}
          <div>
            <p style={{ color: theme.dim }} className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1">
              Proveedor
            </p>
            <div className="space-y-1">
              {provList.map(p => {
                const disabled = p.status === 'pending' || p.status === 'offline';
                const active = activeProvider === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectProvider(p.id)}
                    disabled={disabled}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                    style={{
                      background: active ? `${G}22` : 'transparent',
                      border: `1px solid ${active ? G : 'transparent'}`,
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                    title={p.description}
                  >
                    <span className="text-base">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div style={{ color: active ? G : theme.text }}
                           className="text-xs font-semibold truncate">{p.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: STATUS_COLOR[p.status] || '#6b7280' }} />
                        <span style={{ color: theme.dim }} className="text-[9px]">
                          {STATUS_LABEL[p.status] || p.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context modules */}
          <div>
            <p style={{ color: theme.dim }} className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1">
              Contexto
            </p>
            <div className="space-y-1">
              {CONTEXT_MODULES.map(m => {
                const on = activeModules.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleModule(m.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all"
                    style={{
                      background: on ? `${G}15` : 'transparent',
                      border: `1px solid ${on ? `${G}44` : 'transparent'}`,
                    }}
                  >
                    <span className="text-sm">{m.icon}</span>
                    <span style={{ color: on ? theme.text : theme.dim }}
                          className="text-xs truncate">{m.label}</span>
                    {on && <span style={{ color: G }} className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
            {activeModules.length > 0 && (
              <button onClick={() => setActiveModules([])}
                      className="text-[10px] mt-2 px-3 w-full text-center"
                      style={{ color: theme.dim }}>
                Desactivar todos
              </button>
            )}
          </div>

          {/* Config panel */}
          {showConfig && (
            <div className="border-t pt-3" style={{ borderColor: theme.border }}>
              <p style={{ color: theme.dim }} className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1">
                Configuración
              </p>

              {prov && prov.models.length > 0 && (
                <div className="mb-3">
                  <label style={{ color: theme.dim }} className="text-[10px] block mb-1 px-1">Modelo</label>
                  <select
                    value={activeModel}
                    onChange={e => setActiveModel(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg outline-none"
                    style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                  >
                    {prov.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ color: theme.dim }} className="text-[10px] block mb-1 px-1">
                  Temperatura: {temperature.toFixed(1)}
                </label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                  style={{ accentColor: G }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Chat area ── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-5xl mb-4">🧠</div>
                <p style={{ color: theme.text }} className="text-lg font-semibold mb-1">
                  Supercerebro listo
                </p>
                <p style={{ color: theme.dim }} className="text-sm max-w-sm">
                  Selecciona un proveedor, activa los módulos de contexto que necesitas y haz tu primera pregunta.
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {['¿Cuál es el estado del NOC ahora mismo?', '¿Qué tickets WFM están críticos?', '¿Cómo va el MRR este mes?'].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{ background: `${G}15`, color: G, border: `1px solid ${G}33` }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-3"
                  style={{
                    background: msg.role === 'user' ? `${G}22` : theme.card,
                    border: `1px solid ${msg.role === 'user' ? `${G}44` : theme.border}`,
                  }}
                >
                  {msg.role === 'assistant' && msg.provider && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs" style={{ color: theme.dim }}>
                        {providers[msg.provider]?.icon || '🤖'} {providers[msg.provider]?.name || msg.provider}
                      </span>
                      {msg.model && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${G}15`, color: G }}>
                          {msg.model}
                        </span>
                      )}
                    </div>
                  )}
                  <p style={{ color: theme.text }} className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                  <p style={{ color: theme.dim }} className="text-[10px] mt-1.5 text-right">
                    {fmtTime(msg.ts)}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: G }} className="text-sm">
                      {providers[activeProvider]?.icon || '🤖'}
                    </span>
                    <span style={{ color: theme.dim }} className="text-xs">Pensando…</span>
                    <span className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                              style={{ background: G, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-4 py-3 border-t" style={{ borderColor: theme.border }}>
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder={`Pregunta al ${prov?.name || 'Supercerebro'}… (Enter para enviar, Shift+Enter para nueva línea)`}
                  rows={2}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    background: theme.card,
                    border: `1.5px solid ${input ? G : theme.border}`,
                    color: theme.text,
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: G }}
              >
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2 px-1">
              <span style={{ color: theme.dim }} className="text-[10px]">
                Proveedor activo: <strong style={{ color: G }}>{prov?.icon} {prov?.name || activeProvider}</strong>
              </span>
              {activeModel && (
                <span style={{ color: theme.dim }} className="text-[10px]">· {activeModel}</span>
              )}
              {activeModules.length > 0 && (
                <span style={{ color: theme.dim }} className="text-[10px]">
                  · Contexto: {activeModules.map(m => CONTEXT_MODULES.find(x => x.id === m)?.icon).join(' ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
