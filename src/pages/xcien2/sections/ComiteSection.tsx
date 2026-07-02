import { useState, useRef, useEffect } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import brand from '../../../brand';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ComiteMsg {
  agente_id: string;
  nombre: string;
  icon: string;
  color: string;
  content: string;
  ts: string;
  typing?: boolean;
}

interface Agente {
  id: string;
  nombre: string;
  icon: string;
  color: string;
  rol: string;
}

// ─── Agentes del comité ───────────────────────────────────────────────────────
const AGENTES_COMITE: Agente[] = [
  { id: 'director',    nombre: 'Director General',   icon: '💎', color: '#FFB703', rol: 'Orquestador' },
  { id: 'noc',         nombre: 'NOC',                icon: '📡', color: '#00C896', rol: 'Red y Monitoreo' },
  { id: 'dispatch',    nombre: 'Dispatch',           icon: '🚚', color: '#38BDF8', rol: 'Campo y Logística' },
  { id: 'comercial',   nombre: 'Comercial',          icon: '💼', color: '#A78BFA', rol: 'Ventas y CRM' },
  { id: 'rrhh',        nombre: 'RRHH / Academia',    icon: '🎓', color: '#FB923C', rol: 'Capital Humano' },
  { id: 'legal',       nombre: 'Legal',              icon: '⚖️', color: '#F472B6', rol: 'Contratos y Regulatorio' },
  { id: 'preventa',    nombre: 'Preventa',           icon: '📐', color: '#34D399', rol: 'Factibilidad Técnica' },
  { id: 'odoo',        nombre: 'Odoo',               icon: '🔗', color: '#60A5FA', rol: `ERP ${brand.odooDb || 'ERP'}` },
];

// ─── Scenarios del comité ─────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: 'incidente_red',
    titulo: '🔴 Incidente crítico de red',
    descripcion: 'El nodo troncal de zona industrial cayó. 3 clientes SIDP afectados con SLA activo.',
    participantes: ['director', 'noc', 'dispatch', 'comercial', 'legal'],
  },
  {
    id: 'expansion_plaza',
    titulo: '🏗️ Expansión a nueva plaza',
    descripcion: 'Se detectó oportunidad en Monterrey Norte. Evaluar factibilidad técnica, comercial y regulatoria.',
    participantes: ['director', 'preventa', 'comercial', 'legal', 'rrhh'],
  },
  {
    id: 'renovacion_contrato',
    titulo: '📋 Renovación contrato clave',
    descripcion: 'Cliente Industrias Peñoles requiere renovar contrato anual. Quieren aumentar 50% de capacidad y renegociar SLA.',
    participantes: ['director', 'comercial', 'legal', 'preventa', 'noc'],
  },
  {
    id: 'baja_rendimiento',
    titulo: '📉 Baja de rendimiento técnico',
    descripcion: 'Cuadrilla zona sur tiene indicadores en rojo: 40% de tickets reabiertos, 3 quejas SLA en el mes.',
    participantes: ['director', 'dispatch', 'rrhh', 'noc', 'odoo'],
  },
  {
    id: 'proveedor_falla',
    titulo: '⚠️ Falla de proveedor Cambium',
    descripcion: 'Lote de equipos Cambium cnMedusa presenta fallas a los 30 días. Garantía activa pero proveedor no responde.',
    participantes: ['director', 'legal', 'noc', 'preventa', 'odoo'],
  },
];

// ─── Avatar del agente ────────────────────────────────────────────────────────
function AgenteAvatar({ ag, active, speaking }: { ag: Agente; active: boolean; speaking: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      opacity: active ? 1 : 0.3,
      transition: 'opacity 0.3s',
    }}>
      <div style={{
        width: 52, height: 52,
        borderRadius: '50%',
        background: `${ag.color}18`,
        border: `2px solid ${speaking ? ag.color : active ? ag.color + '60' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        boxShadow: speaking ? `0 0 20px ${ag.color}60` : 'none',
        transition: 'all 0.3s',
        position: 'relative',
      }}>
        {ag.icon}
        {speaking && (
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 14, height: 14, borderRadius: '50%',
            background: ag.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, color: '#000', fontWeight: 900,
          }}>▶</div>
        )}
      </div>
      <div style={{ fontSize: 9, color: ag.color, fontWeight: 700, textAlign: 'center', maxWidth: 60 }}>
        {ag.nombre.split(' ')[0]}
      </div>
    </div>
  );
}

// ─── Burbuja de mensaje ───────────────────────────────────────────────────────
function MsgBubble({ msg, theme }: { msg: ComiteMsg; theme: ThemeConfig }) {
  const isDirector = msg.agente_id === 'director';
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      animation: 'slideIn 0.3s ease',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `${msg.color}20`,
        border: `1.5px solid ${msg.color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
        marginTop: 2,
        boxShadow: isDirector ? `0 0 12px ${msg.color}40` : 'none',
      }}>
        {msg.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: msg.color }}>
            {msg.nombre}
          </span>
          <span style={{ fontSize: 9, color: theme.dim }}>{msg.ts}</span>
        </div>
        <div style={{
          background: isDirector ? `${msg.color}10` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isDirector ? msg.color + '30' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 14,
          borderTopLeftRadius: 4,
          padding: '10px 14px',
          fontSize: 13, lineHeight: 1.65,
          color: theme.text,
          whiteSpace: 'pre-wrap',
        }}>
          {msg.typing ? (
            <span style={{ display: 'flex', gap: 4, alignItems: 'center', color: theme.dim }}>
              <span className="dot-pulse" style={{ fontSize: 20 }}>···</span>
            </span>
          ) : msg.content}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ComiteSection({ theme }: { theme: ThemeConfig }) {
  const [scenario, setScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [msgs, setMsgs] = useState<ComiteMsg[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [customTema, setCustomTema] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const getAgente = (id: string) => AGENTES_COMITE.find(a => a.id === id)!;

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const iniciarComite = async (sc: typeof SCENARIOS[0], temaCustom?: string) => {
    setMsgs([]);
    setDone(false);
    setRunning(true);
    setScenario(sc);

    const tema = temaCustom || sc.descripcion;
    const participantes = sc.participantes.map(id => getAgente(id));

    // Mensaje de apertura del Director
    const director = getAgente('director');
    const tsApertura = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    setSpeakingId('director');
    setMsgs([{
      agente_id: 'director',
      nombre: director.nombre,
      icon: director.icon,
      color: director.color,
      content: '',
      ts: tsApertura,
      typing: true,
    }]);

    await sleep(1200);

    try {
      // Llamar al endpoint del comité
      const res = await fetch(`${API_BASE}/api/agentes/comite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema,
          titulo: sc.titulo,
          participantes: sc.participantes,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const turnos: { agente_id: string; contenido: string }[] = data.turnos || [];

      // Reproducir turnos secuencialmente
      setMsgs([]); // limpiar el typing inicial

      for (const turno of turnos) {
        const ag = getAgente(turno.agente_id);
        if (!ag) continue;

        const ts = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

        // Mostrar typing indicator
        setSpeakingId(ag.id);
        setMsgs(prev => [...prev, {
          agente_id: ag.id,
          nombre: ag.nombre,
          icon: ag.icon,
          color: ag.color,
          content: '',
          ts,
          typing: true,
        }]);

        // Tiempo proporcional a la longitud del mensaje
        const delay = Math.min(Math.max(turno.contenido.length * 12, 1000), 4000);
        await sleep(delay);

        // Reemplazar typing con contenido real
        setMsgs(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            agente_id: ag.id,
            nombre: ag.nombre,
            icon: ag.icon,
            color: ag.color,
            content: turno.contenido,
            ts,
          };
          return updated;
        });

        await sleep(600);
      }
    } catch (err: any) {
      // Fallback: simular con respuestas locales si el endpoint no existe
      setMsgs([]);
      const fallbackTurnos = await runFallback(sc, tema, participantes);
      for (const t of fallbackTurnos) {
        const ts = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        setSpeakingId(t.agente_id);
        setMsgs(prev => [...prev, { ...t, ts, typing: true }]);
        await sleep(Math.min(t.content.length * 10, 3000));
        setMsgs(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], typing: false };
          return updated;
        });
        await sleep(500);
      }
    }

    setSpeakingId(null);
    setDone(true);
    setRunning(false);
  };

  // ─── Fallback local si el backend no tiene el endpoint ────────────────────
  const runFallback = async (sc: typeof SCENARIOS[0], tema: string, participantes: Agente[]) => {
    const turnos: ComiteMsg[] = [];
    const director = getAgente('director');

    turnos.push({
      agente_id: 'director', nombre: director.nombre, icon: director.icon, color: director.color,
      content: `Buenos días a todos. Convoco este comité de emergencia para analizar: "${sc.titulo}".\n\n${tema}\n\nSolicito la perspectiva de cada departamento. NOC, ¿cuál es el estado técnico actual?`,
      ts: '',
    });

    const guiones: Record<string, string> = {
      noc:       `Confirmado desde el panel de Observium. Detectamos ${sc.id === 'incidente_red' ? 'pérdida total de enlace en nodo troncal ZI-Norte desde las 03:47h. MTR muestra pérdida de paquetes al 100% en hop 4. Recomiendo activar protocolo de contingencia RP-07.' : 'métricas de red estables en el momento. Sin alarmas activas en Observium. Podemos dar soporte técnico si es requerido.'}`,
      dispatch:  `Tengo ${sc.id === 'incidente_red' ? '2 técnicos disponibles en zona: Jhony (COR, nivel Avanzado) y Ernesto (CAE). ETA estimado al sitio: 35 minutos. ¿Autorizo desplazamiento?' : 'cuadrillas disponibles para cualquier requerimiento de campo. Zona norte tiene cobertura completa esta semana.'}`,
      comercial: `${sc.id === 'renovacion_contrato' || sc.id === 'incidente_red' ? 'El cliente tiene SLA vigente con penalización por tiempo de inactividad superior a 4 horas. Sugiero comunicación proactiva inmediata para evitar escalación ejecutiva. Ya tengo el contacto del gerente de TI.' : 'Desde ventas apoyamos con información de valor agregado para reforzar la propuesta.'}`,
      legal:     `${sc.id === 'proveedor_falla' || sc.id === 'incidente_red' ? 'Revisé el contrato. La cláusula 8.3 establece penalización de 5% mensual por SLA incumplido. Si el tiempo de restauración supera 6h, el cliente puede exigir crédito. Recomiendo documentar el incidente desde este momento.' : 'No identifico riesgos contractuales relevantes en el escenario planteado. Estoy disponible si necesitan revisión.'}`,
      rrhh:      `${sc.id === 'baja_rendimiento' ? 'Los indicadores del técnico reflejan un patrón de 6 semanas. Recomiendo iniciar protocolo de acompañamiento: sesión de retroalimentación + módulo de refuerzo en Academia. No es causa de baja inmediata según nuestro reglamento.' : 'Capital humano disponible para cualquier refuerzo o capacitación que requiera el equipo de campo.'}`,
      preventa:  `${sc.id === 'expansion_plaza' ? 'Analicé las coordenadas de Monterrey Norte. Hay línea de vista viable desde el edificio Cima Torre. Pérdidas por trayecto estimadas: 142 dB a 5.8GHz. Necesitamos antena directiva mínimo 25 dBi. Puedo tener el radioenlace modelado en 48h.' : 'Desde factibilidad puedo dar soporte técnico en lo que se necesite para este escenario.'}`,
      odoo:      `En ${brand.odooDb || 'ERP'} ya tengo el ticket registrado bajo el proyecto correcto. Actualizo el estado a "En atención" y asigno a la cuadrilla correspondiente. Si el Director General autoriza, ejecuto la actualización de contrato en el módulo de Field Service.`,
    };

    for (const ag of participantes.filter(a => a.id !== 'director')) {
      const guion = guiones[ag.id] || `Desde ${ag.rol}, estoy analizando el escenario y coordino con el equipo lo que se requiera para dar respuesta efectiva.`;
      turnos.push({
        agente_id: ag.id, nombre: ag.nombre, icon: ag.icon, color: ag.color,
        content: guion, ts: '',
      });
    }

    // Cierre del Director
    turnos.push({
      agente_id: 'director', nombre: director.nombre, icon: director.icon, color: director.color,
      content: `Gracias a todos. Con base en los reportes:\n\n${sc.id === 'incidente_red' ? '✅ AUTORIZO desplazamiento inmediato de cuadrilla.\n✅ Comunicación al cliente en los próximos 15 minutos.\n✅ Legal documenta el incidente para respaldo de SLA.\n⏱️ Revisión de estado en 2 horas.' : sc.id === 'baja_rendimiento' ? '✅ RRHH inicia protocolo de acompañamiento esta semana.\n✅ Dispatch reasigna tickets críticos mientras dura el proceso.\n✅ NOC monitorea métricas del técnico en Odoo.\n📅 Revisión en 30 días.' : '✅ Acordamos las acciones presentadas por cada departamento.\n✅ Odoo registra los acuerdos y asigna responsables.\n📅 Seguimiento en próxima sesión.'}\n\nComité concluido. ✦`,
      ts: '',
    });

    return turnos;
  };

  const reset = () => {
    setScenario(null);
    setMsgs([]);
    setDone(false);
    setRunning(false);
    setSpeakingId(null);
    setShowCustom(false);
    setCustomTema('');
  };

  const participantesActivos = scenario
    ? scenario.participantes.map(id => getAgente(id))
    : AGENTES_COMITE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100vh - 120px)', minHeight: 600 }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .dot-pulse { animation: dotPulse 1.2s infinite; }
        @keyframes dotPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${theme.border}`,
        paddingBottom: 16, marginBottom: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0 }}>
            🏛️ Comité de Dirección
          </h2>
          <p style={{ fontSize: 11, color: theme.dim, marginTop: 4 }}>
            Deliberación multi-agente en tiempo real — los 8 agentes operan juntos
          </p>
        </div>
        {(running || done) && (
          <button onClick={reset} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.border}`,
            color: theme.dim, cursor: 'pointer',
          }}>
            ← Nuevo comité
          </button>
        )}
      </div>

      {/* ─── Panel de avatares ───────────────────────────────────────────── */}
      {(running || done) && scenario && (
        <div style={{
          display: 'flex', gap: 16, padding: '14px 0',
          borderBottom: `1px solid ${theme.border}`,
          justifyContent: 'center', flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          {AGENTES_COMITE.map(ag => (
            <AgenteAvatar
              key={ag.id}
              ag={ag}
              active={scenario.participantes.includes(ag.id)}
              speaking={speakingId === ag.id}
            />
          ))}
        </div>
      )}

      {/* ─── Sala de chat ───────────────────────────────────────────────── */}
      {(running || done) && (
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '20px 0',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {/* Encabezado del tema */}
          <div style={{
            background: `${theme.accent}12`,
            border: `1px solid ${theme.accent}30`,
            borderRadius: 12, padding: '12px 18px',
            fontSize: 13, color: theme.dim,
          }}>
            <span style={{ color: theme.accent, fontWeight: 700 }}>📋 Tema: </span>
            {scenario?.titulo} — {scenario?.descripcion}
          </div>

          {msgs.map((msg, i) => (
            <MsgBubble key={i} msg={msg} theme={theme} />
          ))}

          {done && (
            <div style={{
              textAlign: 'center', padding: '16px',
              color: theme.dim, fontSize: 12,
              borderTop: `1px solid ${theme.border}`,
              marginTop: 8,
            }}>
              ✅ Comité concluido · {msgs.length} intervenciones
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ─── Pantalla de selección ──────────────────────────────────────── */}
      {!running && !done && (
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 24 }}>
          {/* Avatares decorativos */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center',
            marginBottom: 28, flexWrap: 'wrap',
          }}>
            {AGENTES_COMITE.map(ag => (
              <AgenteAvatar key={ag.id} ag={ag} active={true} speaking={false} />
            ))}
          </div>

          <p style={{ textAlign: 'center', color: theme.dim, fontSize: 12, marginBottom: 24 }}>
            Selecciona un escenario para convocar al comité
          </p>

          {/* Escenarios */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {SCENARIOS.map(sc => (
              <div
                key={sc.id}
                onClick={() => !running && iniciarComite(sc)}
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 14,
                  padding: '18px 20px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = theme.accent + '60';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = theme.border;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                  {sc.titulo}
                </div>
                <div style={{ fontSize: 11, color: theme.dim, lineHeight: 1.55, marginBottom: 12 }}>
                  {sc.descripcion}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {sc.participantes.map(id => {
                    const ag = getAgente(id);
                    return (
                      <span key={id} style={{
                        fontSize: 9, padding: '2px 8px', borderRadius: 20,
                        background: `${ag.color}15`,
                        border: `1px solid ${ag.color}30`,
                        color: ag.color,
                      }}>
                        {ag.icon} {ag.nombre.split(' ')[0]}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Tema personalizado */}
            <div style={{
              background: theme.card,
              border: `1px dashed ${theme.border}`,
              borderRadius: 14, padding: '18px 20px',
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                ✏️ Tema personalizado
              </div>
              <div style={{ fontSize: 11, color: theme.dim, marginBottom: 12 }}>
                Describe la situación y el Director convocará a los agentes pertinentes.
              </div>
              {showCustom ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    value={customTema}
                    onChange={e => setCustomTema(e.target.value)}
                    placeholder="Describe el escenario operativo..."
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${theme.border}`,
                      color: theme.text, fontSize: 12, lineHeight: 1.5,
                      resize: 'none', outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={() => {
                      if (customTema.trim()) {
                        iniciarComite({
                          id: 'custom',
                          titulo: '✏️ Comité Personalizado',
                          descripcion: customTema.trim(),
                          participantes: ['director', 'noc', 'dispatch', 'comercial', 'legal', 'rrhh'],
                        }, customTema.trim());
                      }
                    }}
                    disabled={!customTema.trim()}
                    style={{
                      padding: '9px 0', borderRadius: 8, border: 'none',
                      background: customTema.trim() ? theme.accent : 'rgba(255,255,255,0.06)',
                      color: customTema.trim() ? '#000' : theme.dim,
                      fontWeight: 700, fontSize: 12, cursor: customTema.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Convocar Comité →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustom(true)}
                  style={{
                    width: '100%', padding: '9px 0', borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.border}`,
                    color: theme.dim, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  + Definir escenario
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
