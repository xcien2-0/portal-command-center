import { useState, useEffect, useCallback } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import brand from '../../../brand';

// ── Odoo eLearning types ──────────────────────────────────────────────────────
interface OdooLesson {
  id: number; name: string; type: string; category: string;
  duration_h: number; published: boolean; sequence: number;
  url: string; website_url: string; has_quiz: boolean; views: number;
}
interface OdooCurso {
  id: number; name: string; description: string;
  total_slides: number; total_time_h: number;
  members: number; published: boolean; enroll: string; channel_type: string;
  avg_completion: number; lessons: OdooLesson[];
  members_list: { name: string; pct: number; status: string }[];
}

// ── Cursos view ───────────────────────────────────────────────────────────────
const SLIDE_TYPE_ICON: Record<string, string> = {
  pdf: '📄', youtube_video: '▶️', google_drive_video: '🎬',
  article: '📝', certification: '🏅', infographic: '🖼️',
};

function BarProgress({ pct, color = '#00C896' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
    </div>
  );
}

function CursosView() {
  const [cursos, setCursos]   = useState<OdooCurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [selected, setSelected] = useState<OdooCurso | null>(null);
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/academia/cursos`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setCursos(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = cursos.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#555', gap: 12 }}>
      <div style={{ width: 16, height: 16, border: '2px solid #00C896', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Cargando cursos desde Odoo...
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#FF4757' }}>
      Error conectando con Odoo: {error}
    </div>
  );

  // ── Detalle de un curso ──────────────────────────────────────────────────
  if (selected) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
          ← Volver
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
            {selected.lessons.length} lecciones · {selected.members} inscritos · {selected.avg_completion}% completado en promedio
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: selected.published ? 'rgba(0,200,150,0.12)' : 'rgba(255,71,87,0.12)', color: selected.published ? '#00C896' : '#FF4757', border: `1px solid ${selected.published ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.3)'}` }}>
            {selected.published ? '● Publicado' : '● No publicado'}
          </span>
          <a href={`${brand.odooUrl}/slides/${selected.id}`} target="_blank" rel="noreferrer"
            style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 8, background: 'rgba(0,200,150,0.15)', color: '#00C896', border: '1px solid rgba(0,200,150,0.3)', textDecoration: 'none' }}>
            Abrir en Odoo ↗
          </a>
        </div>
      </div>

      {/* Lecciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Lecciones</div>
        {selected.lessons.length === 0 ? (
          <div style={{ color: '#555', fontSize: 13, padding: '20px 0' }}>Sin lecciones registradas</div>
        ) : selected.lessons.map(l => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
            <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{SLIDE_TYPE_ICON[l.type] || '📄'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                {l.duration_h > 0 && <span style={{ fontSize: 10, color: '#555' }}>{Math.round(l.duration_h * 60)} min</span>}
                {l.has_quiz && <span style={{ fontSize: 10, color: '#FFB703' }}>🧪 Quiz</span>}
                {l.views > 0 && <span style={{ fontSize: 10, color: '#555' }}>{l.views} vistas</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: l.published ? 'rgba(0,200,150,0.1)' : 'rgba(255,71,87,0.1)', color: l.published ? '#00C896' : '#FF4757' }}>
                {l.published ? 'Publicada' : 'Borrador'}
              </span>
              {l.website_url && (
                <a href={`${brand.odooUrl}${l.website_url}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 10, color: '#555', textDecoration: 'none', padding: '3px 8px', borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  Ver ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Inscritos */}
      {selected.members_list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Inscritos ({selected.members_list.length})</div>
          {selected.members_list.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,200,150,0.12)', border: '1px solid rgba(0,200,150,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#00C896', flexShrink: 0 }}>
                {m.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                <BarProgress pct={m.pct} color={m.pct >= 80 ? '#00C896' : m.pct >= 40 ? '#FFB703' : '#FF4757'} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: m.pct >= 80 ? '#00C896' : m.pct >= 40 ? '#FFB703' : '#555', flexShrink: 0 }}>{m.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Lista de cursos ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar curso..."
          style={{ flex: 1, background: '#151515', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 13, outline: 'none' }} />
        <button onClick={load} style={{ background: '#151515', border: '0.5px solid rgba(255,255,255,0.1)', color: '#555', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12 }}>
          ↺ Actualizar
        </button>
        <div style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>{filtered.length} cursos</div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {filtered.map(c => {
          const hasContent = c.lessons.length > 0;
          const color = c.avg_completion >= 80 ? '#00C896' : c.avg_completion >= 40 ? '#FFB703' : '#4FC3F7';
          return (
            <div key={c.id}
              onClick={() => setSelected(c)}
              style={{ background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 10 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.3)'; (e.currentTarget as HTMLDivElement).style.background = '#1a1a1a'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.background = '#151515'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{c.name}</div>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, flexShrink: 0, background: c.published ? 'rgba(0,200,150,0.1)' : 'rgba(255,255,255,0.04)', color: c.published ? '#00C896' : '#555', border: `0.5px solid ${c.published ? 'rgba(0,200,150,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                  {c.published ? '● Publicado' : '● Borrador'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{c.lessons.length}</div>
                  <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>lecciones</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{c.members}</div>
                  <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>inscritos</div>
                </div>
                {c.total_time_h > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{Math.round(c.total_time_h * 60)}</div>
                    <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>minutos</div>
                  </div>
                )}
              </div>

              {hasContent && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#555' }}>Completado</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color }}>{c.avg_completion}%</span>
                  </div>
                  <BarProgress pct={c.avg_completion} color={color} />
                </div>
              )}

              {!hasContent && (
                <div style={{ fontSize: 10, color: '#333', fontStyle: 'italic' }}>Sin lecciones aún</div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const SLIDES = ['intro','problema','comparacion','solucion','niveles','badges','leaderboard','roadmap','cta'] as const;
type SlideId = typeof SLIDES[number];
const LABELS: Record<SlideId, string> = {
  intro:'Intro', problema:'Problema', comparacion:'Comparación', solucion:'Solución',
  niveles:'Niveles', badges:'Badges', leaderboard:'Ranking', roadmap:'Roadmap', cta:'Cierre',
};

interface Level  { name:string; min:number; max:number; icon:string; color:string; accent:string; count:number }
interface Badge  { icon:string; name:string; desc:string; holders:number; tc:string }
interface Top    { name:string; plaza:string; role:string; pct:number; badges:number; level:string }
interface Phase  { q:string; done:boolean; color:string; items:string[] }

const LEVELS: Level[] = [
  { name:'Aprendiz',     min:0,  max:30,  icon:'🌱', color:'#888',    accent:'rgba(255,255,255,0.03)', count:2  },
  { name:'Técnico',      min:30, max:50,  icon:'🔧', color:'#4FC3F7', accent:'rgba(79,195,247,0.08)',  count:8  },
  { name:'Especialista', min:50, max:65,  icon:'⚙️', color:'#00C896', accent:'rgba(0,200,150,0.08)',   count:15 },
  { name:'Avanzado',     min:65, max:80,  icon:'🏆', color:'#7c3aed', accent:'rgba(124,58,237,0.08)',  count:14 },
  { name:'Experto',      min:80, max:95,  icon:'🎖️', color:'#FFB703', accent:'rgba(255,183,3,0.08)',   count:7  },
  { name:'Leyenda',      min:95, max:100, icon:'⭐', color:'#FF4757', accent:'rgba(255,71,87,0.08)',   count:1  },
];

const BADGES_DATA: Badge[] = [
  { icon:'🔧', name:'Maestro Instalador', desc:'100% en Instalación',      holders:3,  tc:'#4FC3F7' },
  { icon:'📡', name:'RF Pro',             desc:'Dominio total Redes RF',   holders:2,  tc:'#7c3aed' },
  { icon:'⭐', name:`Leyenda ${brand.name}`,  desc:'Avance ≥ 95%',            holders:1,  tc:'#FFB703' },
  { icon:'🔥', name:'Firewall Hero',      desc:'Habilidad crítica',       holders:4,  tc:'#FF4757' },
  { icon:'🏅', name:'Top de Plaza',       desc:'Mejor técnico en ciudad', holders:6,  tc:'#00C896' },
  { icon:'💥', name:'Racha x5',           desc:'5 capacitaciones seguidas',holders:8, tc:'#FFB703' },
];

const TOP5: Top[] = [
  { name:'Brian Quintero Choreño',      plaza:'CDMX',       role:'COR', pct:100,   badges:12, level:'Leyenda' },
  { name:'Jose Guadalupe Balderas',     plaza:'Nuevo León', role:'COR', pct:95.83, badges:10, level:'Leyenda' },
  { name:'Erik Alberto Silva Olivares', plaza:'Nuevo León', role:'CAE', pct:91.67, badges:9,  level:'Experto' },
  { name:'Miguel Angel Flores Herrera', plaza:'Nuevo León', role:'COR', pct:91.67, badges:9,  level:'Experto' },
  { name:'Andres Guadalupe Guardado',   plaza:'Nuevo León', role:'COR', pct:89.58, badges:8,  level:'Experto' },
];

const ROADMAP: Phase[] = [
  { q:'Q2 2025', done:true,  color:'#00C896', items:['Matriz de habilidades v1','Sistema de 6 niveles','15 badges definidos','Datos de 47 técnicos'] },
  { q:'Q3 2025', done:false, color:'#FFB703', items:[`Portal web ${brand.academiaLabel}`,'Exámenes en línea','Integración con Odoo','Login individual'] },
  { q:'Q4 2025', done:false, color:'#888',    items:['App móvil técnicos','Smart contracts bonos','Certificaciones oficiales','Expansión 100+'] },
];

const BEFORE_AFTER = [
  { b:'Hoja de cálculo estática',    a:'Dashboard interactivo en tiempo real' },
  { b:'Sin visibilidad por técnico',  a:'Perfil individual con 48 habilidades' },
  { b:'Capacitación sin incentivos',  a:'Niveles, badges y bonos automáticos' },
  { b:'Brechas detectadas tarde',     a:'Gaps visibles al instante por plaza'  },
  { b:'Sin historial de progreso',    a:'Evolución trimestral registrada'       },
  { b:'Evaluación subjetiva',         a:'Exámenes objetivos ligados a Odoo'    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const DIM = '#888';
const GREEN = '#00C896';
const RED   = '#FF4757';

function MatrixBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.1, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)',
        fontFamily: 'monospace', fontSize: 12, color: '#00ff88', textShadow: '0 0 8px #00ff88',
        whiteSpace: 'nowrap', userSelect: 'none'
      }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{ 
            animation: `matrixFall ${15 + Math.random() * 25}s linear infinite`,
            animationDelay: `${-Math.random() * 25}s`,
            writingMode: 'vertical-rl',
            textAlign: 'center'
          }}>
            {Array.from({ length: 60 }).map(() => Math.random() > 0.5 ? '1' : '0').join(' ')}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes matrixFall {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)',
  borderRadius: 12, padding: 20,
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)', color: DIM }}>
      {children}
    </span>
  );
}

function Ring({ pct, size = 40, stroke = 3, color = '#FFB703' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(pct), 100); return () => clearTimeout(t); }, [pct]);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${(p / 100) * circ} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

function SectionTitle({ sub, main, dim }: { sub: string; main: string; dim: string }) {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: GREEN, marginBottom: 12, fontFamily: 'Oswald, sans-serif', textShadow: `0 0 10px ${GREEN}40` }}>{sub}</div>
      <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, marginBottom: 24, fontFamily: 'Oswald, sans-serif', letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#fff', textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>
        {main.split('|').map((part, i) => (
          i === 0 ? <span key={i}>{part}<br /></span> : <span key={i} style={{ color: DIM, fontWeight: 400 }}>{part}</span>
        ))}
        {dim && <><span style={{ color: DIM, fontWeight: 400, fontSize: 40 }}>{dim}</span></>}
      </div>
    </>
  );
}

// ── Slides ────────────────────────────────────────────────────────────────────
function SlideIntro() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip>Field Services</Chip><Chip>47 técnicos</Chip><Chip>6 plazas · México</Chip>
      </div>
      <div style={{ fontSize: 'clamp(80px,10vw,120px)', fontWeight: 800, lineHeight: 0.8, letterSpacing: -3, marginBottom: 24, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#fff', textShadow: '0 0 50px rgba(0,255,136,0.3)' }}>
        Academia<br /><span style={{ fontWeight: 400, color: GREEN, textShadow: `0 0 30px ${GREEN}60` }}>{brand.name}</span>
      </div>
      <p style={{ fontSize: 16, color: DIM, lineHeight: 1.7, marginBottom: 40, maxWidth: 600 }}>
        El sistema que convierte capacitación en carrera,<br />esfuerzo en reconocimiento, técnicos en leyendas.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, width: '100%', maxWidth: 540 }}>
        {[['47', '', 'Técnicos'], ['62.3', '%', 'Avance global'], ['48', '', 'Habilidades'], ['15', '', 'Badges']].map(([v, s, l], i) => (
          <div key={i} style={{ ...card, textAlign: 'center', padding: '16px 10px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1, fontFamily: 'Oswald, sans-serif', color: i === 1 ? '#00ff88' : 'inherit' }}>{v}{s}</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideProblema() {
  const [hov, setHov] = useState<number | null>(null);
  const items = [
    { icon: '📊', t: 'Cero visibilidad',  d: 'Las habilidades vivían en una hoja estática.', stat: '0%',   sl: 'datos en vivo'        },
    { icon: '😶', t: 'Sin motivación',    d: 'Los técnicos no veían su progreso.',            stat: '62%',  sl: 'avance sin incentivos'},
    { icon: '🎯', t: 'Brechas ocultas',   d: 'Habilidades críticas no se detectaban.',        stat: '8.5%', sl: 'cobertura Firewall'   },
  ];
  return (
    <div style={{ maxWidth: 800 }}>
      <SectionTitle sub="El problema" main="Sin sistema," dim="sin dirección" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {items.map((c, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ ...card, cursor: 'pointer', transition: 'all .2s', transform: hov === i ? 'translateY(-3px)' : 'none', borderColor: hov === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 24, marginBottom: 14 }}>{c.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{c.t}</div>
            <div style={{ fontSize: 13, color: DIM, lineHeight: 1.6, marginBottom: 16 }}>{c.d}</div>
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 500, color: RED }}>{c.stat}</div>
              <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{c.sl}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideComparacion() {
  return (
    <div style={{ maxWidth: 700 }}>
      <SectionTitle sub="Antes · Después" main="La transformación" dim="es visible" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,71,87,0.08)', border: '0.5px solid rgba(255,71,87,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED }} /><span style={{ fontSize: 12, fontWeight: 500, color: RED }}>Sin Academia</span>
        </div>
        <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(0,200,150,0.08)', border: '0.5px solid rgba(0,200,150,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN }} /><span style={{ fontSize: 12, fontWeight: 500, color: GREEN }}>Con Academia</span>
        </div>
        {BEFORE_AFTER.map((item, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 13, color: RED }}>✕</span><span style={{ fontSize: 13, color: DIM }}>{item.b}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', marginTop: 10 }}>
              <span style={{ fontSize: 13, color: GREEN }}>✓</span><span style={{ fontSize: 13, fontWeight: 500 }}>{item.a}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideSolucion() {
  const [hov, setHov] = useState<number | null>(null);
  const items = [
    { icon: '📈', t: 'Niveles progresivos', d: '6 niveles desde Aprendiz hasta Leyenda.'    },
    { icon: '🏅', t: 'Badges por dominio',  d: '15 logros desbloqueables por categoría.'    },
    { icon: '🏆', t: 'Leaderboard en vivo', d: 'Rankings por plaza, rol y región.'           },
    { icon: '💰', t: 'Bonos automáticos',   d: 'Smart contracts en n8n + Odoo.'             },
  ];
  return (
    <div style={{ maxWidth: 700 }}>
      <SectionTitle sub="La solución" main="Gamificación" dim="que sí funciona" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {items.map((c, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ ...card, transition: 'all .2s', transform: hov === i ? 'translateY(-3px)' : 'none', borderColor: hov === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <div style={{ fontSize: 22, marginBottom: 12 }}>{c.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{c.t}</div>
            <div style={{ fontSize: 13, color: DIM, lineHeight: 1.6 }}>{c.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideNiveles() {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div style={{ maxWidth: 800 }}>
      <SectionTitle sub="Sistema de niveles" main="Tu carrera," dim="paso a paso" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {LEVELS.map((lv, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ ...card, cursor: 'pointer', transition: 'all .2s', borderTop: hov === i ? `2px solid ${lv.color}` : '0.5px solid rgba(255,255,255,0.06)', background: hov === i ? lv.accent : '#151515', transform: hov === i ? 'translateY(-3px)' : 'none' }}>
            <div style={{ fontSize: 22, marginBottom: 12 }}>{lv.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{lv.name}</div>
            <div style={{ fontSize: 12, color: DIM, marginBottom: 10 }}>{lv.min}–{lv.max}%</div>
            <span style={{ fontSize: 11, color: lv.color, fontWeight: 500, background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 20 }}>{lv.count} técnicos</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideBadges() {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div style={{ maxWidth: 800 }}>
      <SectionTitle sub="Sistema de badges" main="Gana reconocimiento," dim="demuestra tu dominio" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {BADGES_DATA.map((b, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ ...card, padding: 16, transition: 'all .2s', transform: hov === i ? 'translateY(-3px)' : 'none', borderColor: hov === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: hov === i ? `${b.tc}22` : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'background .2s' }}>{b.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: DIM, marginBottom: 8, lineHeight: 1.5 }}>{b.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: b.tc, width: `${(b.holders / 47) * 100}%`, transition: 'width .9s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, color: b.tc, fontWeight: 500 }}>{b.holders}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideLeaderboard() {
  const [hov, setHov] = useState<number | null>(null);
  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['#FFB703', '#aaa', '#FF4757', '#aaa', '#aaa'];
  return (
    <div style={{ maxWidth: 700 }}>
      <SectionTitle sub="Leaderboard 2025" main="Top técnicos —" dim="¿dónde estás tú?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TOP5.map((t, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)', transition: 'all .2s', transform: hov === i ? 'translateX(4px)' : 'none', cursor: 'pointer' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
              {i < 3 ? medals[i] : i + 1}
            </div>
            <Ring pct={t.pct} size={40} stroke={3} color={colors[i]} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <Chip>{t.role}</Chip><Chip>📍{t.plaza}</Chip><Chip>{t.level}</Chip>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{t.pct === 100 ? '100' : t.pct.toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{t.badges} badges</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideRoadmap() {
  return (
    <div style={{ maxWidth: 800 }}>
      <SectionTitle sub="Roadmap" main="El plan para" dim="la academia" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {ROADMAP.map((ph, i) => (
          <div key={i} style={{ ...card, borderTop: `2px solid ${ph.color}`, borderRadius: '0 0 12px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{ph.q}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: ph.color, background: `${ph.color}18`, padding: '2px 8px', borderRadius: 20 }}>
                {ph.done ? 'Completado' : i === 1 ? 'En progreso' : 'Próximo'}
              </span>
            </div>
            {ph.items.map((item, j) => (
              <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: ph.color, marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: DIM, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideExamen({ theme }: { theme: ThemeConfig }) {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 200px)', minHeight: 600, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: `1px solid ${theme.border}`, background: theme.bg }}>
        <iframe 
          src={`${API_BASE}/static/examen_holo.html?accent=${encodeURIComponent(theme.accent)}&bg=${encodeURIComponent(theme.bg)}&card=${encodeURIComponent(theme.card)}&text=${encodeURIComponent(theme.text)}&dim=${encodeURIComponent(theme.dim)}`} 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Examen Holo"
        />
      </div>
    </div>
  );
}

function SlideCTA({ onStartExam }: { onStartExam: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}><Chip>{brand.academiaLabel}</Chip><Chip>Q3 2025</Chip></div>
      <div style={{ fontSize: 'clamp(32px,4vw,50px)', fontWeight: 500, lineHeight: 1.05, letterSpacing: -2, marginBottom: 16 }}>
        ¿Listo para ser<br /><span style={{ fontWeight: 400, color: DIM }}>una Leyenda?</span>
      </div>
      <p style={{ fontSize: 15, color: DIM, lineHeight: 1.7, marginBottom: 36 }}>
        Tu progreso, tus badges, tu carrera — todo en un solo lugar.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          onClick={onStartExam}
          style={{ padding: '12px 32px', borderRadius: 40, background: 'white', color: '#0A0A0A', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
          Realizar Examen de Colocación
        </button>
      </div>
    </div>
  );
}

const SLIDE_COMPONENTS: Record<SlideId, (props: any) => React.ReactElement> = {
  intro:       SlideIntro,
  problema:    SlideProblema,
  comparacion: SlideComparacion,
  solucion:    SlideSolucion,
  niveles:     SlideNiveles,
  badges:      SlideBadges,
  leaderboard: SlideLeaderboard,
  roadmap:     SlideRoadmap,
  examen:      SlideExamen,
  cta:         SlideCTA,
};

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { theme: ThemeConfig; activeThemeId?: string }
export default function AcademiaSection({ theme, activeThemeId }: Props) {
  const [view, setView] = useState<'dashboard' | 'cursos' | 'exam'>('cursos');
  const [idx, setIdx] = useState(0);
  const total = SLIDES.length;

  const go = (i: number) => { if (i >= 0 && i < total) setIdx(i); };

  useEffect(() => {
    if (view !== 'dashboard') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(idx + 1);
      if (e.key === 'ArrowLeft')  go(idx - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [idx, view]);

  const SlideComp = SLIDE_COMPONENTS[SLIDES[idx]];

  return (
    <div style={{ background: '#0d1117', borderRadius: theme.radius, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header / Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', background: '#151515' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{brand.academiaLabel.toUpperCase()}</span>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              ['cursos',    '🎓 Cursos Odoo'],
              ['dashboard', '📊 Estrategia'],
              ['exam',      '🔮 Evaluación'],
            ] as [typeof view, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setView(id)} style={{
                background: view === id ? `${theme.accent}20` : 'transparent',
                color: view === id ? theme.accent : DIM,
                border: 'none', padding: '6px 16px', borderRadius: 20,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}>{label}</button>
            ))}
          </div>
        </div>

        {view === 'dashboard' && (
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 40, padding: '4px 6px' }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                style={{
                  height: 24, minWidth: i === idx ? 70 : 24, borderRadius: 40, padding: '0 8px',
                  border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 500,
                  background: i === idx ? '#151515' : 'transparent',
                  color: i === idx ? 'white' : DIM, transition: 'all .25s', whiteSpace: 'nowrap'
                }}>
                {i === idx ? LABELS[SLIDES[i]] : '·'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' }}>
        {activeThemeId === 'matrix' && <MatrixBackground />}
        {view === 'cursos' && <CursosView />}
        {view === 'dashboard' && (
          <div key={idx} style={{ minHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: theme.animations ? 'slideUp .4s ease' : 'none' }}>
            <SlideComp theme={theme} onStartExam={() => setView('exam')} />
          </div>
        )}
        {view === 'exam' && (
          <div style={{ height: '100%', minHeight: 700 }}>
            <SlideExamen theme={theme} />
          </div>
        )}
      </div>

      {/* Footer Nav for Dashboard */}
      {view === 'dashboard' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '0 0 16px' }}>
          {([['←', idx === 0, () => go(idx - 1)], ['→', idx === total - 1, () => go(idx + 1)]] as [string, boolean, () => void][]).map(([label, disabled, fn], i) => (
            <button key={i} onClick={fn} disabled={disabled}
              style={{ width: 34, height: 34, borderRadius: '50%', fontSize: 14, background: '#151515', border: '0.5px solid rgba(255,255,255,0.1)', color: disabled ? '#555' : 'white', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1, transition: 'all .2s' }}>
              {label}
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
