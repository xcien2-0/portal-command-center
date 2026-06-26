import { ThemeConfig } from '../types';
import { useState } from 'react';

interface Props { theme: ThemeConfig }

const FASE_ACTUAL = 0; // 0=5S, 1=Metamorfosis, 2=Integración

const FASES = [
  { year: '2026',      nombre: 'Reordenar la Casa',    subtitulo: '5S',                    color: '#26a641', desc: 'Orden, limpieza y disciplina operativa. Establecer los cimientos.' },
  { year: '2027–2028', nombre: 'Metamorfosis',          subtitulo: 'Crecimiento',            color: '#58a6ff', desc: 'Crecer con servicios de valor agregado. Escalar el modelo.' },
  { year: '2029–2030', nombre: 'Integración Disruptiva',subtitulo: 'TechCo',                color: '#d2a8ff', desc: 'Soluciones intersectoriales. XCIEN como plataforma tecnológica.' },
];

const OBJETIVOS = [
  { id: 1, nombre: 'Robustecimiento de Red',           icon: '📡', color: '#26a641', progreso: 35, seccion: 'noc',      items: ['Arquitectura de red resiliente','Infraestructura eléctrica robusta','Nodos redundantes'] },
  { id: 2, nombre: 'Crecimiento de Red',               icon: '📶', color: '#58a6ff', progreso: 20, seccion: 'red',      items: ['Adquisición de WISPs','Nuevas radiobases','Despliegue de Fibra Óptica','Lobbying con asociaciones'] },
  { id: 3, nombre: 'Conectividad Inteligente',         icon: '🔗', color: '#e3b341', progreso: 15, seccion: 'wfm',      items: ['Nuevos productos empresa y gobierno','FO · microonda · satelital · WiFi','Alianzas tecnológicas','Evaluación proceso comercial'] },
  { id: 4, nombre: 'Capital',                          icon: '💰', color: '#f78166', progreso: 40, seccion: 'gerencia', items: ['Inversión con estrategia','Eficiencias operativas','Reducción de costos ocultos'] },
  { id: 5, nombre: 'Ingresos',                         icon: '📈', color: '#39d353', progreso: 45, seccion: 'ventas',   items: ['Más ingreso por cliente','Nuevos productos y servicios','Canales remotos y nacionales','Segmentos PYME y gobierno'] },
  { id: 6, nombre: 'Gobierno',                         icon: '🏛️', color: '#d2a8ff', progreso: 10, seccion: 'reports',  items: ['Vertical especializada','Ciberseguridad · videovigilancia','Redes privadas · servicios administrados','Desarrollo de software'] },
  { id: 7, nombre: 'Madurez Digital',                  icon: '🤖', color: '#14b8a6', progreso: 55, seccion: 'academia', items: ['NOC consolidado','TI robusto y estratégico','Cadena de suministro','RRHH y certificaciones','Servicio al cliente excepcional'] },
];

const DIAGNOSTICO = [
  { area: 'Estrategia',  items: ['Visión estratégica difusa','KPIs para la foto','Liderazgo reactivo','Reuniones sin decisiones','Todo es urgente, nada estratégico'] },
  { area: 'Operaciones', items: ['Procesos no documentados','Dependencia de personas clave','Cultura del bombero','Proyectos zombie','Departamentos en silos'] },
  { area: 'Tecnología',  items: ['ERP/CRM imprácticos','TI reactivo','Equipos obsoletos','Reportes manuales','Sin control de activos'] },
  { area: 'Personas',    items: ['Sin plan de carrera','Baja capacitación','Rotación elevada','Ambiente tóxico','Desconocen hacia dónde va la empresa'] },
  { area: 'Clientes',    items: ['SLAs incumplidos','Sin medición de satisfacción','Promesas rotas','Cancelaciones sin análisis','Experiencias inconsistentes'] },
  { area: 'Finanzas',    items: ['Alta morosidad','Costos ocultos','Inventarios descontrolados','Compras sin planeación'] },
];

const VALORES = [
  { nombre: 'Audacia Visionaria',            icon: '🎯', desc: 'Pensar en grande, decisiones valientes basadas en datos y tendencias.' },
  { nombre: 'Innovación Disruptiva',         icon: '⚡', desc: 'Saltos cuánticos, no mejoras incrementales. Experimentar y aprender rápido.' },
  { nombre: 'Agilidad Asertiva',             icon: '🚀', desc: 'Decidir rápido, simplificar, sin parálisis por análisis.' },
  { nombre: 'Autodeterminación Responsable', icon: '🛡️', desc: 'Ownership real. Transparencia y accountability en cada acción.' },
  { nombre: 'Colaboración Sinérgica',        icon: '🤝', desc: 'Trabajo en red, no en silos. El éxito es colectivo.' },
];

type Tab = 'vision' | 'objetivos' | 'diagnostico' | 'valores';

export default function Estrategia2030Section({ theme }: Props) {
  const [tab, setTab]       = useState<Tab>('vision');
  const [objSel, setObjSel] = useState<number | null>(null);

  const G = theme.accent;
  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '20px 24px',
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>🚀</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: G }}>
              XCIEN 2030 — Conectividad Inteligente
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Plan estratégico de transformación  ·  De WISP a TechCo
            </p>
          </div>
        </div>

        {/* Fase actual badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: `${FASES[FASE_ACTUAL].color}22`,
          border: `1px solid ${FASES[FASE_ACTUAL].color}66`,
          borderRadius: 20, padding: '4px 14px', marginTop: 8,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: FASES[FASE_ACTUAL].color, display: 'inline-block', boxShadow: `0 0 6px ${FASES[FASE_ACTUAL].color}` }} />
          <span style={{ fontSize: 12, color: FASES[FASE_ACTUAL].color, fontWeight: 600 }}>
            Fase actual: {FASES[FASE_ACTUAL].subtitulo} — {FASES[FASE_ACTUAL].year}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        {([
          { id: 'vision',      label: '🗺️  Ruta 2030' },
          { id: 'objetivos',   label: '🎯  7 Objetivos' },
          { id: 'diagnostico', label: '🔍  Diagnóstico' },
          { id: 'valores',     label: '💎  Valores' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all .15s',
            background: tab === t.id ? G : 'rgba(255,255,255,0.06)',
            color: tab === t.id ? '#000' : 'rgba(255,255,255,0.6)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══ TAB: VISIÓN / RUTA ══ */}
      {tab === 'vision' && (
        <div>
          {/* Misión / Visión */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'MISIÓN', texto: 'Integrar conectividad inteligente con soluciones tecnológicas que generen valor a nuestros clientes, soportada con un servicio excepcional.' },
              { label: 'VISIÓN', texto: 'Ser reconocidos como líder en comunicaciones y tecnologías, sumando socios de negocio en una plataforma integral que redefina la forma en que operan las empresas.' },
            ].map(mv => (
              <div key={mv.label} style={{ ...card, borderColor: `${G}44` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: G, letterSpacing: 2, marginBottom: 8 }}>{mv.label}</div>
                <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{mv.texto}</p>
              </div>
            ))}
          </div>

          {/* Timeline 2026-2030 */}
          <h3 style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16, fontWeight: 600 }}>
            Ruta de transformación
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
            {FASES.map((f, i) => (
              <div key={i} style={{
                ...card,
                borderColor: i === FASE_ACTUAL ? `${f.color}88` : 'rgba(255,255,255,0.08)',
                background: i === FASE_ACTUAL ? `${f.color}12` : 'rgba(255,255,255,0.03)',
                position: 'relative', overflow: 'hidden',
              }}>
                {i === FASE_ACTUAL && (
                  <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 10, color: f.color, fontWeight: 700, background: `${f.color}22`, padding: '2px 8px', borderRadius: 10 }}>ACTUAL</div>
                )}
                <div style={{ fontSize: 22, fontWeight: 800, color: f.color, marginBottom: 2 }}>{f.year}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>{f.subtitulo}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{f.nombre}</div>
                <div style={{ height: 1, background: `${f.color}33`, marginBottom: 10 }} />
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Modelo de generación de valor */}
          <h3 style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 14, fontWeight: 600 }}>
            Modelo de generación de valor
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { icon: '🎁', titulo: 'Propuesta de Valor Diferenciada', items: ['Innovación / desarrollo de servicios','Análisis de competencia','Encuestas de satisfacción'] },
              { icon: '✅', titulo: 'Cumplimiento en Entrega',         items: ['Personal capacitado y comprometido','Procesos eficientes','Tecnología que soporte operaciones'] },
              { icon: '📊', titulo: 'Mayores Ingresos + Reinversión',  items: ['Inversión con estrategia','Ahorros por eficiencias','Más ingresos por cliente'] },
            ].map(v => (
              <div key={v.titulo} style={card}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{v.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 10 }}>{v.titulo}</div>
                {v.items.map(it => (
                  <div key={it} style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', paddingLeft: 10, borderLeft: `2px solid ${G}44`, marginBottom: 5 }}>{it}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB: OBJETIVOS ══ */}
      {tab === 'objetivos' && (
        <div style={{ display: 'grid', gridTemplateColumns: objSel !== null ? '1fr 1fr' : '1fr', gap: 14 }}>
          {/* Lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {OBJETIVOS.map(obj => (
              <div key={obj.id}
                onClick={() => setObjSel(objSel === obj.id ? null : obj.id)}
                style={{
                  ...card, cursor: 'pointer', transition: 'all .15s',
                  borderColor: objSel === obj.id ? `${obj.color}88` : 'rgba(255,255,255,0.08)',
                  background: objSel === obj.id ? `${obj.color}10` : 'rgba(255,255,255,0.04)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{obj.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                        {obj.id}. {obj.nombre}
                      </span>
                      <span style={{ fontSize: 12, color: obj.color, fontWeight: 600 }}>{obj.progreso}%</span>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${obj.progreso}%`, background: obj.color, borderRadius: 3, transition: 'width 0.6s ease', boxShadow: `0 0 6px ${obj.color}88` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Detalle */}
          {objSel !== null && (() => {
            const obj = OBJETIVOS.find(o => o.id === objSel)!;
            return (
              <div style={{ ...card, borderColor: `${obj.color}66`, background: `${obj.color}08`, alignSelf: 'start', position: 'sticky', top: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 28 }}>{obj.icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: obj.color }}>Objetivo {obj.id}</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{obj.nombre}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Iniciativas</div>
                  {obj.items.map(it => (
                    <div key={it} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <span style={{ color: obj.color, marginTop: 2 }}>▸</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{it}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Avance estimado 2026</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${obj.progreso}%`, background: `linear-gradient(90deg, ${obj.color}88, ${obj.color})`, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: obj.color }}>{obj.progreso}%</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══ TAB: DIAGNÓSTICO ══ */}
      {tab === 'diagnostico' && (
        <div>
          <div style={{ ...card, borderColor: '#f7816633', background: '#f7816608', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              La presentación estratégica identifica <strong style={{ color: '#f78166' }}>30 síntomas</strong> agrupados en 6 áreas. Este diagnóstico es el punto de partida honesto de la transformación hacia TechCo.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            {DIAGNOSTICO.map(d => (
              <div key={d.area} style={card}>
                <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{d.area}</div>
                {d.items.map(it => (
                  <div key={it} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: '#f78166', fontSize: 12, marginTop: 1, flexShrink: 0 }}>✗</span>
                    <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{it}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB: VALORES ══ */}
      {tab === 'valores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {VALORES.map((v, i) => (
            <div key={v.nombre} style={{
              ...card,
              display: 'grid', gridTemplateColumns: '56px 1fr',
              gap: 16, alignItems: 'center',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `${G}22`, border: `1px solid ${G}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>{v.icon}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: G, background: `${G}22`, padding: '2px 8px', borderRadius: 10 }}>V{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{v.nombre}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{v.desc}</p>
              </div>
            </div>
          ))}

          {/* Cita */}
          <div style={{ ...card, borderColor: `${G}33`, background: `${G}08`, textAlign: 'center', marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
              "Lo verdaderamente peligroso es no evolucionar."
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>— Jeff Bezos</p>
          </div>
        </div>
      )}
    </div>
  );
}
