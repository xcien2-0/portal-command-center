/**
 * FeedbackWidget — botón flotante "💡 Mejorar proceso" presente en todas las secciones.
 * Aparece en esquina inferior derecha. Captura sugerencias de mejora por proceso.
 */
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { X, Send, Lightbulb, CheckCircle } from 'lucide-react';

interface Props {
  section: string;
  sectionLabel?: string;
}

const CATEGORIAS = [
  { id: 'proceso',       label: 'Proceso',        color: '#3b82f6' },
  { id: 'ux',            label: 'Usabilidad',      color: '#a855f7' },
  { id: 'datos',         label: 'Datos / Info',    color: '#f59e0b' },
  { id: 'automatizacion',label: 'Automatización',  color: '#00A859' },
  { id: 'otro',          label: 'Otro',            color: '#6b7280' },
];

export default function FeedbackWidget({ section, sectionLabel }: Props) {
  const { user }            = useAuth();
  const { track }           = useAnalytics();
  const [open, setOpen]     = useState(false);
  const [texto, setTexto]   = useState('');
  const [cat, setCat]       = useState('proceso');
  const [sending, setSend]  = useState(false);
  const [done, setDone]     = useState(false);
  const textRef             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && textRef.current) textRef.current.focus();
    if (open) setDone(false);
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const submit = async () => {
    if (!texto.trim()) return;
    setSend(true);
    try {
      await fetch('/api/analytics/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id:  crypto.randomUUID(),
          user_id:     user?.id     ?? null,
          user_email:  user?.email  ?? null,
          user_nombre: user?.nombre ?? null,
          rol:         user?.rol    ?? null,
          section,
          categoria: cat,
          texto:     texto.trim(),
        }),
      });
      track('feedback', { section, categoria: cat, chars: texto.length });
      setDone(true);
      setTexto('');
      setTimeout(() => setOpen(false), 2000);
    } catch { /* ignore */ } finally {
      setSend(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Sugerir mejora para este proceso"
        style={{
          position:   'fixed',
          bottom:     24,
          right:      24,
          zIndex:     1000,
          background: open ? '#00A859' : '#0d1117',
          border:     `1.5px solid ${open ? '#00A859' : '#374151'}`,
          borderRadius: 24,
          padding:    '8px 14px',
          display:    'flex',
          alignItems: 'center',
          gap:        6,
          cursor:     'pointer',
          color:      open ? '#001a0e' : '#9ca3af',
          fontSize:   12,
          fontWeight: 600,
          boxShadow:  open ? '0 0 20px #00A85944' : '0 2px 8px #00000066',
          transition: 'all 0.2s',
          fontFamily: 'monospace',
        }}
      >
        <Lightbulb size={14} color={open ? '#001a0e' : '#00A859'} />
        {open ? 'Cerrar' : 'Mejorar proceso'}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position:     'fixed',
          bottom:       68,
          right:        24,
          zIndex:       1001,
          width:        320,
          background:   '#0d1117',
          border:       '1px solid #1f2937',
          borderRadius: 12,
          boxShadow:    '0 8px 32px #000000bb',
          fontFamily:   'monospace',
          overflow:     'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: '#111827',
            padding:    '12px 16px',
            display:    'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1f2937',
          }}>
            <div>
              <div style={{ color: '#f9fafb', fontSize: 13, fontWeight: 700 }}>
                Sugerir mejora
              </div>
              <div style={{ color: '#4b5563', fontSize: 10, marginTop: 2 }}>
                {sectionLabel || section}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}>
              <X size={15} />
            </button>
          </div>

          <div style={{ padding: 16 }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={32} color="#00A859" style={{ marginBottom: 8 }} />
                <div style={{ color: '#00A859', fontWeight: 700, fontSize: 13 }}>¡Gracias!</div>
                <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>Tu sugerencia fue registrada.</div>
              </div>
            ) : (
              <>
                {/* Categoría */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Tipo de mejora
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {CATEGORIAS.map(c => (
                      <button key={c.id} onClick={() => setCat(c.id)} style={{
                        background: cat === c.id ? `${c.color}22` : 'transparent',
                        border:     `1px solid ${cat === c.id ? c.color : '#374151'}`,
                        color:      cat === c.id ? c.color : '#6b7280',
                        borderRadius: 4,
                        padding:    '3px 9px',
                        fontSize:   10,
                        cursor:     'pointer',
                        fontWeight: cat === c.id ? 700 : 400,
                      }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Texto */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ¿Qué mejorarías?
                  </div>
                  <textarea
                    ref={textRef}
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    placeholder="Describe el problema o la mejora que propones..."
                    rows={4}
                    onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submit(); }}
                    style={{
                      width:        '100%',
                      background:   '#111827',
                      border:       '1px solid #374151',
                      borderRadius: 6,
                      color:        '#e5e7eb',
                      fontSize:     12,
                      padding:      '8px 10px',
                      resize:       'vertical',
                      outline:      'none',
                      boxSizing:    'border-box',
                      fontFamily:   'monospace',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#00A85966')}
                    onBlur={e  => (e.target.style.borderColor = '#374151')}
                  />
                  <div style={{ color: '#374151', fontSize: 9, marginTop: 3, textAlign: 'right' }}>
                    ⌘ + Enter para enviar
                  </div>
                </div>

                <button
                  onClick={submit}
                  disabled={sending || !texto.trim()}
                  style={{
                    width:        '100%',
                    background:   texto.trim() ? '#00A859' : '#1f2937',
                    border:       'none',
                    borderRadius: 6,
                    color:        texto.trim() ? '#001a0e' : '#4b5563',
                    padding:      '9px 0',
                    fontSize:     12,
                    fontWeight:   700,
                    cursor:       texto.trim() ? 'pointer' : 'default',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    gap:          6,
                    transition:   'all 0.2s',
                    fontFamily:   'monospace',
                  }}
                >
                  <Send size={13} />
                  {sending ? 'Enviando...' : 'Enviar sugerencia'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
