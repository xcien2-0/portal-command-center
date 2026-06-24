import { useState, useEffect, useCallback } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import brand from '../../../brand';
import { useAuth } from '@/contexts/AuthContext';
import AcademiaGerencial from './academia/AcademiaGerencial';
import AcademiaTecnico from './academia/AcademiaTecnico';

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

// ── Academia Stats (datos reales desde Odoo) ──────────────────────────────────
interface AcademiaStats {
  total_tecnicos: number;
  avance_global: number;
  total_cursos: number;
  total_badges: number;
  top5: { name: string; pct: number; cursos: number; level: string }[];
  level_distribution: Record<string, number>;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const SLIDES = ['intro','problema','comparacion','solucion','niveles','badges','leaderboard','roadmap','cta'] as const;
type SlideId = typeof SLIDES[number];
const LABELS: Record<SlideId, string> = {
  intro: 'Intro', problema: 'Problema', comparacion: 'Comparación', solucion: 'Solución',
  niveles: 'Niveles', badges: 'Badges', leaderboard: 'Ranking', roadmap: 'Roadmap', cta: 'Cierre',
};

interface Level  { name:string; min:number; max:number; icon:string; color:string; accent:string }
interface Badge  { icon:string; name:string; desc:string; tc:string }
interface Phase  { q:string; done:boolean; color:string; items:string[] }

const LEVELS: Level[] = [
  { name:'Aprendiz',     min:0,  max:30,  icon:'🌱', color:'#888',    accent:'rgba(255,255,255,0.03)' },
  { name:'Técnico',      min:30, max:50,  icon:'🔧', color:'#4FC3F7', accent:'rgba(79,195,247,0.08)'  },
  { name:'Especialista', min:50, max:65,  icon:'⚙️', color:'#00C896', accent:'rgba(0,200,150,0.08)'   },
  { name:'Avanzado',     min:65, max:80,  icon:'🏆', color:'#7c3aed', accent:'rgba(124,58,237,0.08)'  },
  { name:'Experto',      min:80, max:95,  icon:'🎖️', color:'#FFB703', accent:'rgba(255,183,3,0.08)'   },
  { name:'Leyenda',      min:95, max:100, icon:'⭐', color:'#FF4757', accent:'rgba(255,71,87,0.08)'   },
];

const BADGES_DATA: Badge[] = [
  { icon:'🔧', name:'Maestro Instalador', desc:'100% en Instalación',       tc:'#4FC3F7' },
  { icon:'📡', name:'RF Pro',             desc:'Dominio total Redes RF',    tc:'#7c3aed' },
  { icon:'⭐', name:`Leyenda ${brand.name}`,  desc:'Avance ≥ 95%',         tc:'#FFB703' },
  { icon:'🔥', name:'Firewall Hero',      desc:'Habilidad crítica',         tc:'#FF4757' },
  { icon:'🏅', name:'Top de Plaza',       desc:'Mejor técnico en ciudad',   tc:'#00C896' },
  { icon:'💥', name:'Racha x5',           desc:'5 capacitaciones seguidas', tc:'#FFB703' },
];

const ROADMAP: Phase[] = [
  { q:'Q2 2025', done:true,  color:'#00C896', items:['Matriz de habilidades v1','Sistema de 6 niveles','15 badges definidos','Datos de 47 técnicos'] },
  { q:'Q3 2025', done:true,  color:'#FFB703', items:[`Portal web ${brand.academiaLabel}`,'Exámenes en línea','Integración con Odoo','Login individual'] },
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

// Valores pre-calculados fuera del componente — no se regeneran en cada render
const MATRIX_COLS = Array.from({ length: 30 }, () => ({
  duration: 15 + Math.random() * 25,
  delay:    -Math.random() * 25,
  chars:    Array.from({ length: 60 }, () => Math.random() > 0.5 ? '1' : '0').join(' '),
}));

function MatrixBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.1, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)',
        fontFamily: 'monospace', fontSize: 12, color: '#00ff88', textShadow: '0 0 8px #00ff88',
        whiteSpace: 'nowrap', userSelect: 'none'
      }}>
        {MATRIX_COLS.map((col, i) => (
          <div key={i} style={{
            animation: `matrixFall ${col.duration}s linear infinite`,
            animationDelay: `${col.delay}s`,
            writingMode: 'vertical-rl',
            textAlign: 'center'
          }}>
            {col.chars}
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

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)', color: DIM, ...style }}>
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
function SlideIntro({ stats }: { stats: AcademiaStats | null }) {
  const tecnicos = stats?.total_tecnicos ?? '—';
  const avance   = stats ? Math.round(stats.avance_global) : '—';
  const cursos   = stats?.total_cursos   ?? '—';
  const badges   = stats?.total_badges   ?? '—';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip>Field Services</Chip>
        <Chip>{tecnicos} técnicos</Chip>
        <Chip>6 plazas · México</Chip>
        {stats && <Chip style={{ color: GREEN, borderColor: `${GREEN}40`, background: `${GREEN}10` }}>● Odoo en vivo</Chip>}
      </div>
      <div style={{ fontSize: 'clamp(80px,10vw,120px)', fontWeight: 800, lineHeight: 0.8, letterSpacing: -3, marginBottom: 24, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#fff', textShadow: '0 0 50px rgba(0,255,136,0.3)' }}>
        Academia<br /><span style={{ fontWeight: 400, color: GREEN, textShadow: `0 0 30px ${GREEN}60` }}>{brand.name}</span>
      </div>
      <p style={{ fontSize: 16, color: DIM, lineHeight: 1.7, marginBottom: 40, maxWidth: 600 }}>
        El sistema que convierte capacitación en carrera,<br />esfuerzo en reconocimiento, técnicos en leyendas.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, width: '100%', maxWidth: 540 }}>
        {([
          [String(tecnicos), '',  'Técnicos'],
          [String(avance),   '%', 'Avance global'],
          [String(cursos),   '',  'Cursos activos'],
          [String(badges),   '',  'Quizzes'],
        ] as [string,string,string][]).map(([v, s, l], i) => (
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

function SlideNiveles({ stats }: { stats: AcademiaStats | null }) {
  const [hov, setHov] = useState<number | null>(null);
  const dist = stats?.level_distribution ?? {};
  return (
    <div style={{ maxWidth: 800 }}>
      <SectionTitle sub="Sistema de niveles" main="Tu carrera," dim="paso a paso" />
      {stats && (
        <div style={{ fontSize: 10, color: GREEN, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>●</span><span>Distribución real · {stats.total_tecnicos} técnicos inscritos en Odoo</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {LEVELS.map((lv, i) => {
          const count = dist[lv.name] ?? 0;
          return (
            <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{ ...card, cursor: 'pointer', transition: 'all .2s', borderTop: hov === i ? `2px solid ${lv.color}` : '0.5px solid rgba(255,255,255,0.06)', background: hov === i ? lv.accent : '#151515', transform: hov === i ? 'translateY(-3px)' : 'none' }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>{lv.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{lv.name}</div>
              <div style={{ fontSize: 12, color: DIM, marginBottom: 10 }}>{lv.min}–{lv.max}%</div>
              <span style={{ fontSize: 11, color: lv.color, fontWeight: 500, background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 20 }}>
                {stats ? `${count} técnicos` : '— técnicos'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideBadges() {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div style={{ maxWidth: 800 }}>
      <SectionTitle sub="Sistema de badges" main="Gana reconocimiento," dim="demuestra tu dominio" />
      <div style={{ fontSize: 10, color: '#FFB703', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(255,183,3,0.07)', borderRadius: 8, border: '0.5px solid rgba(255,183,3,0.2)' }}>
        <span>⚠</span><span>Sistema de gamificación en desarrollo — los badges se activarán con el módulo de bonos</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {BADGES_DATA.map((b, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ ...card, padding: 16, transition: 'all .2s', transform: hov === i ? 'translateY(-3px)' : 'none', borderColor: hov === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', cursor: 'pointer', opacity: 0.85 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: hov === i ? `${b.tc}22` : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'background .2s' }}>{b.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: DIM, marginBottom: 8, lineHeight: 1.5 }}>{b.desc}</div>
                <span style={{ fontSize: 10, color: '#FFB703', background: 'rgba(255,183,3,0.08)', padding: '2px 8px', borderRadius: 20 }}>Próximamente</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideLeaderboard({ stats, statsLoaded }: { stats: AcademiaStats | null; statsLoaded: boolean }) {
  const [hov, setHov] = useState<number | null>(null);
  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['#FFB703', '#aaa', '#FF4757', '#4FC3F7', '#00C896'];
  const top5 = stats?.top5 ?? [];
  return (
    <div style={{ maxWidth: 700 }}>
      <SectionTitle sub="Leaderboard en vivo" main="Top técnicos —" dim="¿dónde estás tú?" />
      {stats ? (
        <div style={{ fontSize: 10, color: GREEN, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>●</span><span>Datos reales de Odoo · Promedio de avance en todos los cursos inscritos</span>
        </div>
      ) : (
        <div style={{ fontSize: 10, color: '#FFB703', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⚠</span><span>Cargando datos desde Odoo...</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {top5.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: DIM, fontSize: 13 }}>
            {!statsLoaded ? 'Cargando leaderboard...' : stats ? 'Sin técnicos inscritos en Odoo aún.' : 'No se pudo conectar con Odoo.'}
          </div>
        ) : top5.map((t, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)', transition: 'all .2s', transform: hov === i ? 'translateX(4px)' : 'none', cursor: 'pointer' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
              {i < 3 ? medals[i] : i + 1}
            </div>
            <Ring pct={t.pct} size={40} stroke={3} color={colors[i] ?? DIM} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <Chip>{t.level}</Chip>
                <Chip>{t.cursos} cursos</Chip>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{typeof t.pct === 'number' ? (t.pct === 100 ? '100' : t.pct.toFixed(1)) : '—'}%</div>
              <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>avance promedio</div>
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

// ── Exam View ─────────────────────────────────────────────────────────────────

// Shared question/answer types (Odoo)
interface OdooAnswer      { id: number; text: string }
interface OdooPregunta    { id: number; question: string; slide: string; answers: OdooAnswer[] }
interface OdooExamen      { channel_id: number; name: string; total: number; preguntas: OdooPregunta[] }
interface OdooResult      { score_pct: number; correctas: number; total: number; nivel: string; xp_awarded: number; aprobado: boolean }
interface OdooCursoSlim   { id: number; name: string; total_slides: number; lessons: { has_quiz: boolean }[] }

// Colocación types
interface ColPregunta  { id: number; competencia_key: string; competencia_label: string; pregunta: string; opciones: string[] }
interface ColData      { total: number; preguntas: ColPregunta[] }
interface ColCompResult { key: string; label: string; correctas: number; total: number; pct: number; aprobada: boolean }
interface ColResult    {
  tecnico_name: string; plaza: string; total_correctas: number; total_preguntas: number;
  comp_pct: number; total_aprobadas: number; total_competencias: number;
  nivel: string; nivel_num: number; xp_awarded: number;
  competencias: ColCompResult[];
  plan_capacitacion: { num: number; nombre: string; descripcion: string }[];
  fecha: string;
}

// ── Shared: generic question flow ─────────────────────────────────────────────
function QuestionFlow({
  title, subtitle, preguntas, onSubmit, onBack, loading, error,
  renderQuestion, totalLabel,
}: {
  title: string; subtitle: string;
  preguntas: { id: number | string; label?: string }[];
  onSubmit: (resp: Record<string, number>) => void;
  onBack: () => void; loading: boolean; error: string;
  renderQuestion: (q: any, selected: number | undefined, onSelect: (v: number) => void) => React.ReactNode;
  totalLabel?: string;
}) {
  const [qIdx, setQIdx]       = useState(0);
  const [resp, setResp]       = useState<Record<string, number>>({});
  const total    = preguntas.length;
  const answered = Object.keys(resp).length;
  const current  = preguntas[qIdx] as any;
  const pct      = Math.round((answered / total) * 100);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: DIM, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 4 }}>← Volver</button>
          <div style={{ fontSize: 11, color: DIM }}>{subtitle}</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Pregunta {qIdx + 1} de {total}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: DIM, marginBottom: 4 }}>{answered}/{total} respondidas</div>
          <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: GREEN, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <div style={{ background: '#151515', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, marginBottom: 16 }}>
        {current?.competencia_label && (
          <div style={{ fontSize: 10, color: GREEN, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>
            📋 {current.competencia_label}
          </div>
        )}
        {current?.slide && (
          <div style={{ fontSize: 10, color: DIM, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>📄 {current.slide}</div>
        )}
        {renderQuestion(current, resp[String(current?.id)], (v) => setResp(p => ({ ...p, [String(current.id)]: v })))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setQIdx(i => Math.max(0, i - 1))} disabled={qIdx === 0}
          style={{ padding: '10px 20px', borderRadius: 10, background: '#151515', border: '0.5px solid rgba(255,255,255,0.1)', color: qIdx === 0 ? '#333' : '#fff', cursor: qIdx === 0 ? 'not-allowed' : 'pointer', fontSize: 13 }}>
          ← Anterior
        </button>
        {qIdx < total - 1 ? (
          <button onClick={() => setQIdx(i => i + 1)}
            style={{ flex: 1, padding: '10px 20px', borderRadius: 10, background: resp[String(current?.id)] !== undefined ? 'rgba(0,200,150,0.15)' : '#151515', border: `0.5px solid ${resp[String(current?.id)] !== undefined ? 'rgba(0,200,150,0.3)' : 'rgba(255,255,255,0.1)'}`, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Siguiente →
          </button>
        ) : (
          <button onClick={() => onSubmit(resp)} disabled={loading || answered < total}
            style={{ flex: 1, padding: '10px 20px', borderRadius: 10, background: answered >= total ? GREEN : '#151515', border: 'none', color: answered >= total ? '#000' : '#333', cursor: answered >= total && !loading ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}>
            {loading ? 'Evaluando...' : answered < total ? `Responde todas (${answered}/${total})` : '✓ Enviar examen'}
          </button>
        )}
      </div>

      {/* Dot nav */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 18, justifyContent: 'center' }}>
        {preguntas.map((p, i) => (
          <button key={i} onClick={() => setQIdx(i)}
            style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${i === qIdx ? GREEN : resp[String(p.id)] !== undefined ? 'rgba(0,200,150,0.4)' : 'rgba(255,255,255,0.1)'}`, background: i === qIdx ? 'rgba(0,200,150,0.15)' : resp[String(p.id)] !== undefined ? 'rgba(0,200,150,0.06)' : 'transparent', color: i === qIdx ? GREEN : resp[String(p.id)] !== undefined ? GREEN : DIM, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            {i + 1}
          </button>
        ))}
      </div>
      {error && <div style={{ marginTop: 12, color: '#FF4757', fontSize: 12 }}>{error}</div>}
    </div>
  );
}

// ── Colocación Flow ────────────────────────────────────────────────────────────
function ColocacionFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep]       = useState<'intro' | 'loading' | 'exam' | 'result'>('intro');
  const [data, setData]       = useState<ColData | null>(null);
  const [result, setResult]   = useState<ColResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [nombre, setNombre]   = useState('');
  const [plaza, setPlaza]     = useState('');

  const PLAZAS = ['Monterrey', 'Saltillo', 'Reynosa', 'Querétaro', 'Guadalajara', 'CDMX', 'Otra'];

  const loadExam = async () => {
    setStep('loading'); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/academia/examen/colocacion/preguntas`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: ColData = await r.json();
      setData(d); setStep('exam');
    } catch (e: any) { setError(e.message); setStep('intro'); }
  };

  const submit = async (resp: Record<string, number>) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/academia/examen/colocacion/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuestas: resp, tecnico_name: nombre, plaza }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setResult(await r.json()); setStep('result');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Intro
  if (step === 'intro') return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: DIM, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 20 }}>← Volver</button>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Oswald, sans-serif', letterSpacing: -1, marginBottom: 8 }}>
          Examen de Colocación
        </div>
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.8, maxWidth: 440, margin: '0 auto' }}>
          Evalúa tus conocimientos en las <strong style={{ color: '#fff' }}>13 competencias técnicas</strong> de la Matriz de Habilidades XCIEN.<br />
          <span style={{ fontSize: 12 }}>~26 preguntas · Generadas por IA · Nivel de campo real</span>
        </p>
      </div>

      {/* Competency chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
        {['Habilitación','Radiobase','Enlace','Wireless','Redes','Routing','Energía','Electricidad','Operaciones','Seguridad','Procesos','Clientes','Soft Skills'].map(c => (
          <span key={c} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,200,150,0.08)', border: '0.5px solid rgba(0,200,150,0.2)', color: GREEN }}>{c}</span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 11, color: DIM, display: 'block', marginBottom: 5 }}>Nombre completo</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Juan Pérez García"
            style={{ width: '100%', background: '#151515', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: DIM, display: 'block', marginBottom: 5 }}>Plaza</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PLAZAS.map(p => (
              <button key={p} onClick={() => setPlaza(p)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${plaza === p ? GREEN : 'rgba(255,255,255,0.1)'}`, background: plaza === p ? 'rgba(0,200,150,0.12)' : 'transparent', color: plaza === p ? GREEN : DIM, fontSize: 12, cursor: 'pointer' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 10, color: '#FF4757', fontSize: 12, marginBottom: 16 }}>{error}</div>}

      <button onClick={loadExam}
        style={{ width: '100%', padding: '14px', borderRadius: 12, background: nombre ? GREEN : 'rgba(255,255,255,0.05)', border: 'none', color: nombre ? '#000' : '#333', fontSize: 15, fontWeight: 700, cursor: nombre ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
        {nombre ? 'Comenzar examen →' : 'Ingresa tu nombre para continuar'}
      </button>
    </div>
  );

  // Loading
  if (step === 'loading') return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${GREEN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
      <div style={{ fontSize: 14, color: DIM }}>Generando banco de preguntas con IA...</div>
      <div style={{ fontSize: 11, color: '#333', marginTop: 8 }}>Esto puede tomar ~30 segundos la primera vez</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Exam
  if (step === 'exam' && data) return (
    <QuestionFlow
      title="Examen de Colocación"
      subtitle={`${nombre}${plaza ? ` · ${plaza}` : ''}`}
      preguntas={data.preguntas}
      onSubmit={submit}
      onBack={() => setStep('intro')}
      loading={loading}
      error={error}
      renderQuestion={(q: ColPregunta, selected, onSelect) => (
        <>
          <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.55, marginBottom: 22 }}>{q.pregunta}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opciones.map((op, i) => {
              const sel = selected === i;
              return (
                <button key={i} onClick={() => onSelect(i)}
                  style={{ textAlign: 'left', padding: '13px 18px', borderRadius: 10, border: `1.5px solid ${sel ? GREEN : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(0,200,150,0.1)' : 'rgba(255,255,255,0.02)', color: sel ? '#fff' : '#ccc', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? GREEN : 'rgba(255,255,255,0.2)'}`, background: sel ? GREEN : 'transparent', flexShrink: 0, transition: 'all 0.15s' }} />
                  {op}
                </button>
              );
            })}
          </div>
        </>
      )}
    />
  );

  // Result
  if (step === 'result' && result) {
    const NIVEL_COLOR: Record<string, string> = { AVANZADO: '#00C896', INTERMEDIO: '#FFB703', BÁSICO: '#FF4757' };
    const NIVEL_ICON:  Record<string, string> = { AVANZADO: '🏆', INTERMEDIO: '🔧', BÁSICO: '🌱' };
    const nc = NIVEL_COLOR[result.nivel] || GREEN;
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Top */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{NIVEL_ICON[result.nivel] || '🎓'}</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Oswald, sans-serif', letterSpacing: -1, marginBottom: 4 }}>
            {result.tecnico_name || 'Resultado'}
          </div>
          {result.plaza && <div style={{ fontSize: 12, color: DIM, marginBottom: 16 }}>📍 {result.plaza}</div>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ padding: '16px 24px', borderRadius: 12, background: `${nc}14`, border: `1px solid ${nc}40`, textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: nc, fontFamily: 'Oswald, sans-serif' }}>{result.nivel}</div>
              <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>Nivel asignado</div>
            </div>
            <div style={{ padding: '16px 24px', borderRadius: 12, background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)', textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Oswald, sans-serif' }}>{result.total_aprobadas}/{result.total_competencias}</div>
              <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>Competencias cubiertas</div>
            </div>
            <div style={{ padding: '16px 24px', borderRadius: 12, background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)', textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#FFB703', fontFamily: 'Oswald, sans-serif' }}>+{result.xp_awarded}</div>
              <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>XP ganado</div>
            </div>
          </div>
        </div>

        {/* Competency grid */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: DIM, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Perfil de competencias</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {result.competencias.map(c => (
              <div key={c.key} style={{ padding: '10px 14px', borderRadius: 10, background: c.aprobada ? 'rgba(0,200,150,0.07)' : 'rgba(255,71,87,0.07)', border: `1px solid ${c.aprobada ? 'rgba(0,200,150,0.25)' : 'rgba(255,71,87,0.25)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{c.aprobada ? '✓' : '✗'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.aprobada ? '#fff' : '#FF4757', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: DIM }}>{c.correctas}/{c.total} correctas</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Training plan */}
        {result.plan_capacitacion.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: DIM, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              Plan de capacitación recomendado ({result.plan_capacitacion.length} módulos)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.plan_capacitacion.map(m => (
                <div key={m.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#151515', border: '0.5px solid rgba(255,183,3,0.2)', borderRadius: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,183,3,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#FFB703', flexShrink: 0 }}>M{m.num}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{m.nombre}</div>
                    <div style={{ fontSize: 11, color: DIM, lineHeight: 1.5 }}>{m.descripcion}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.plan_capacitacion.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 14, color: GREEN, fontWeight: 600 }}>¡Perfil completo! No se requieren módulos adicionales.</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => { setStep('intro'); setResult(null); setData(null); }}
            style={{ padding: '11px 24px', borderRadius: 40, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            Nuevo examen
          </button>
          <button onClick={() => { setStep('exam'); setResult(null); }}
            style={{ padding: '11px 24px', borderRadius: 40, background: GREEN, border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#333', marginTop: 16 }}>{result.fecha}</div>
      </div>
    );
  }

  return null;
}

// ── Odoo Courses Flow ──────────────────────────────────────────────────────────
function OdooFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep]       = useState<'select' | 'exam' | 'result'>('select');
  const [cursos, setCursos]   = useState<OdooCursoSlim[]>([]);
  const [examen, setExamen]   = useState<OdooExamen | null>(null);
  const [result, setResult]   = useState<OdooResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [nombre, setNombre]   = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/academia/cursos`)
      .then(r => r.json())
      .then((data: OdooCursoSlim[]) => {
        const wq = data.filter(c => c.lessons.some(l => l.has_quiz));
        setCursos(wq.length > 0 ? wq : data);
      })
      .catch(() => {});
  }, []);

  const startExam = async (channelId: number) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/academia/examen/${channelId}/preguntas`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: OdooExamen = await r.json();
      if (d.total === 0) { setError('Este curso no tiene preguntas de examen en Odoo. Agrega quizzes a las lecciones para habilitarlo.'); setLoading(false); return; }
      setExamen(d); setStep('exam');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (step === 'select') return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: DIM, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 20 }}>← Volver</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Exámenes de Cursos Odoo</div>
      <div style={{ fontSize: 13, color: DIM, marginBottom: 20 }}>Preguntas cargadas directamente desde Odoo eLearning.</div>
      <div style={{ marginBottom: 16 }}>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre (opcional)"
          style={{ width: '100%', background: '#151515', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      {error && <div style={{ padding: '10px 14px', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 10, color: '#FF4757', fontSize: 12, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cursos.map(c => {
          const qc = c.lessons.filter(l => l.has_quiz).length;
          return (
            <div key={c.id} onClick={() => !loading && startExam(c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(0,200,150,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{c.total_slides} lecciones {qc > 0 ? `· 🧪 ${qc} con quiz` : ''}</div>
              </div>
              <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>{loading ? '...' : 'Iniciar →'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (step === 'exam' && examen) return (
    <QuestionFlow
      title={examen.name}
      subtitle={examen.name}
      preguntas={examen.preguntas.map(p => ({ ...p, id: p.id }))}
      onSubmit={async (resp) => {
        setLoading(true); setError('');
        try {
          const r = await fetch(`${API_BASE}/api/academia/examen/submit`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel_id: examen.channel_id, respuestas: resp, tecnico_name: nombre }),
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          setResult(await r.json()); setStep('result');
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
      }}
      onBack={() => setStep('select')}
      loading={loading}
      error={error}
      renderQuestion={(q: OdooPregunta, selected, onSelect) => (
        <>
          <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.55, marginBottom: 22 }}>{q.question}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.answers.map(a => {
              const sel = selected === a.id;
              return (
                <button key={a.id} onClick={() => onSelect(a.id)}
                  style={{ textAlign: 'left', padding: '13px 18px', borderRadius: 10, border: `1.5px solid ${sel ? GREEN : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(0,200,150,0.1)' : 'rgba(255,255,255,0.02)', color: sel ? '#fff' : '#ccc', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? GREEN : 'rgba(255,255,255,0.2)'}`, background: sel ? GREEN : 'transparent', flexShrink: 0 }} />
                  {a.text}
                </button>
              );
            })}
          </div>
        </>
      )}
    />
  );

  if (step === 'result' && result) {
    const NC: Record<string, string> = { Aprendiz: '#888', Técnico: '#4FC3F7', Especialista: '#00C896', Senior: '#d97706' };
    const nc = NC[result.nivel] || GREEN;
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>{result.aprobado ? '🎉' : '📚'}</div>
        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Oswald, sans-serif', letterSpacing: -1, marginBottom: 8 }}>{result.aprobado ? '¡Aprobado!' : 'Sigue practicando'}</div>
        <div style={{ fontSize: 13, color: DIM, marginBottom: 28 }}>{nombre ? `${nombre} · ` : ''}{result.correctas}/{result.total} correctas</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ padding: '20px 28px', borderRadius: 12, background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: result.aprobado ? GREEN : '#FF4757', fontFamily: 'Oswald, sans-serif' }}>{result.score_pct}%</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>Puntaje</div>
          </div>
          <div style={{ padding: '20px 28px', borderRadius: 12, background: `${nc}14`, border: `1px solid ${nc}40` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: nc, fontFamily: 'Oswald, sans-serif' }}>{result.nivel}</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>Nivel</div>
          </div>
          <div style={{ padding: '20px 28px', borderRadius: 12, background: '#151515', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#FFB703', fontFamily: 'Oswald, sans-serif' }}>+{result.xp_awarded}</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>XP</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => { setStep('select'); setResult(null); setExamen(null); }}
            style={{ padding: '10px 22px', borderRadius: 40, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            Otro examen
          </button>
          {!result.aprobado && (
            <button onClick={() => { setStep('exam'); setResult(null); }}
              style={{ padding: '10px 22px', borderRadius: 40, background: GREEN, border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ── Main ExamenView ────────────────────────────────────────────────────────────
function ExamenView() {
  const [mode, setMode] = useState<null | 'colocacion' | 'odoo'>(null);

  if (mode === 'colocacion') return <ColocacionFlow onBack={() => setMode(null)} />;
  if (mode === 'odoo')       return <OdooFlow onBack={() => setMode(null)} />;

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: GREEN, marginBottom: 10 }}>Evaluación</div>
        <div style={{ fontSize: 34, fontWeight: 800, fontFamily: 'Oswald, sans-serif', letterSpacing: -1, marginBottom: 8 }}>
          ¿Qué tipo de examen<br /><span style={{ color: DIM, fontWeight: 400 }}>quieres realizar?</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Colocación */}
        <div onClick={() => setMode('colocacion')}
          style={{ padding: 24, borderRadius: 16, background: '#151515', border: '1px solid rgba(0,200,150,0.15)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.5)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,200,150,0.05)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.15)'; (e.currentTarget as HTMLDivElement).style.background = '#151515'; }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Examen de Colocación</div>
          <div style={{ fontSize: 12, color: DIM, lineHeight: 1.7 }}>
            13 competencias técnicas<br />
            ~26 preguntas generadas por IA<br />
            <span style={{ color: GREEN, fontWeight: 600 }}>Asigna nivel de ingreso</span>
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: GREEN, fontWeight: 600 }}>Para técnicos nuevos →</div>
        </div>

        {/* Promoción / Odoo */}
        <div onClick={() => setMode('odoo')}
          style={{ padding: 24, borderRadius: 16, background: '#151515', border: '1px solid rgba(83,74,183,0.2)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(83,74,183,0.5)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(83,74,183,0.05)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(83,74,183,0.2)'; (e.currentTarget as HTMLDivElement).style.background = '#151515'; }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Examen de Promoción</div>
          <div style={{ fontSize: 12, color: DIM, lineHeight: 1.7 }}>
            Cursos de Odoo eLearning<br />
            Preguntas por módulo<br />
            <span style={{ color: '#7c3aed', fontWeight: 600 }}>Evalúa cursos completados</span>
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>Para ascenso de nivel →</div>
        </div>
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

interface SlideProps { theme: ThemeConfig; stats: AcademiaStats | null; statsLoaded: boolean; onStartExam: () => void }
const SLIDE_COMPONENTS: Record<SlideId, (props: SlideProps) => React.ReactElement> = {
  intro:       (p) => <SlideIntro       stats={p.stats} />,
  problema:    ()  => <SlideProblema />,
  comparacion: ()  => <SlideComparacion />,
  solucion:    ()  => <SlideSolucion />,
  niveles:     (p) => <SlideNiveles     stats={p.stats} />,
  badges:      ()  => <SlideBadges />,
  leaderboard: (p) => <SlideLeaderboard stats={p.stats} statsLoaded={p.statsLoaded} />,
  roadmap:     ()  => <SlideRoadmap />,
  cta:         (p) => <SlideCTA onStartExam={p.onStartExam} />,
};

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { theme: ThemeConfig; activeThemeId?: string }
export default function AcademiaSection({ theme, activeThemeId }: Props) {
  const { user } = useAuth();

  // Roles gerenciales → vista gerencial
  const ROLES_GERENCIALES = ['admin', 'director', 'wfm', 'comercial', 'readonly'];
  const esGerencial = user ? ROLES_GERENCIALES.includes(user.rol) : true;

  // Admin/director pueden cambiar de vista
  const [forceView, setForceView] = useState<'gerencial' | 'tecnico' | null>(null);
  const vistaActual = forceView ?? (esGerencial ? 'gerencial' : 'tecnico');

  const [view, setView] = useState<'dashboard' | 'cursos' | 'exam'>('cursos');
  const [idx, setIdx] = useState(0);
  const [stats, setStats] = useState<AcademiaStats | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const total = SLIDES.length;

  const go = (i: number) => setIdx(Math.max(0, Math.min(i, total - 1)));

  // Fetch stats reales desde Odoo
  useEffect(() => {
    fetch(`${API_BASE}/api/academia/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .catch((e) => { console.warn('[AcademiaSection] stats fetch failed:', e); })
      .finally(() => setStatsLoaded(true));
  }, []);

  useEffect(() => {
    if (view !== 'dashboard') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, total - 1));
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, total]);

  const SlideComp = SLIDE_COMPONENTS[SLIDES[idx]];

  // ── Vistas nuevas (gerencial / técnico) ──────────────────────────────────
  if (vistaActual === 'gerencial' || vistaActual === 'tecnico') {
    return (
      <div style={{ background: '#0d1117', borderRadius: theme.radius, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Selector de vista para admin/director */}
        {(esGerencial || user?.rol === 'admin' || user?.rol === 'director') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#151515' }}>
            <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Vista:</span>
            {(['gerencial', 'tecnico'] as const).map(v => (
              <button key={v} onClick={() => setForceView(v)}
                style={{ padding: '5px 14px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: vistaActual === v ? '#00C896' : 'rgba(255,255,255,0.04)',
                  color: vistaActual === v ? '#001a12' : '#6b7280',
                }}>
                {v === 'gerencial' ? '📊 Gerencial' : '👤 Mi Perfil'}
              </button>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {vistaActual === 'gerencial'
            ? <AcademiaGerencial theme={theme} />
            : <AcademiaTecnico theme={theme} nombreTecnico={user?.nombre ?? ''} onExamen={() => setView('exam')} />
          }
        </div>
        {/* Examen modal si técnico lo solicitó */}
        {vistaActual === 'tecnico' && view === 'exam' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, maxWidth: 760, width: '95%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              <button onClick={() => setView('cursos')} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>✕ Cerrar</button>
              <ExamenView />
            </div>
          </div>
        )}
      </div>
    );
  }

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
            <SlideComp theme={theme} stats={stats} statsLoaded={statsLoaded} onStartExam={() => setView('exam')} />
          </div>
        )}
        {view === 'exam' && (
          <div style={{ minHeight: 600 }}>
            <ExamenView />
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
