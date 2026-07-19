import { ThemeConfig } from '../types';
import { useState, useEffect } from 'react';
import { API_BASE } from '../../../config';
import brand from '../../../brand';

const FODA_BASE: FodaData = {
  swot: {
    fortalezas: [
      "Integración de última milla con microondas y fibra propia.",
      "Soporte Nivel 2 altamente capacitado (skillPct promedio > 80%).",
      "Certificación obligatoria antes de despacho (Academia Digital).",
      "Tokenización de transacciones para trazabilidad absoluta.",
    ],
    oportunidades: [
      "Migración masiva de clientes de microondas a fibra (Up-selling).",
      "Automatización del despacho basada en geolocalización.",
      "Monetización de los tokens de desempeño para retención.",
    ],
    debilidades: [
      "Fragmentación de la información entre Odoo y el Portal.",
      "Latencia elevada en algunos nodos rurales (NOCBoard alerts).",
      "Curva de aprendizaje de nuevos estándares técnicos.",
    ],
    amenazas: [
      "Competidores de bajo costo (Starlink/ISPs locales).",
      "Desgaste de equipos en nodos por clima extremo.",
      "Rotación de técnicos certificados por alta demanda.",
    ],
  },
  dialogue: [
    { agente: "Director General", msj: "Equipo, necesitamos un FODA crudo. ¿Cuál es nuestro mayor riesgo ahora?" },
    { agente: "NOC Agent", msj: "La latencia en los nodos rurales. Si no automatizamos el balanceo de carga, perderemos clientes VIP." },
    { agente: "WFM Agent", msj: "Y la rotación. Capacitamos técnicos en la Academia y luego se van a la competencia." },
    { agente: "Academia Agent", msj: "Propongo que el 'Cambio de Área' sea automático al completar certificaciones." },
  ],
};

interface FodaData {
  swot: {
    fortalezas: string[];
    oportunidades: string[];
    debilidades: string[];
    amenazas: string[];
  };
  dialogue: Array<{ agente: string; msj: string }>;
}

export default function FodaSection({ theme }: { theme: ThemeConfig }) {
  const [data, setData] = useState<FodaData>(FODA_BASE);
  const [source, setSource] = useState<'base' | 'ia'>('base');
  const [generating, setGenerating] = useState(false);

  const regenerateWithIA = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/agentes/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agente_id: 'director',
          message: `Genera un análisis FODA actualizado para ${brand.orgName} en 2026. Incluye fortalezas, oportunidades, debilidades y amenazas basadas en el contexto operativo real de la empresa: red de telecomunicaciones con fibra y microondas, técnicos de campo, sistema de academia digital, clientes VIP, y competencia de Starlink. Formato: devuelve texto estructurado con secciones FORTALEZAS, OPORTUNIDADES, DEBILIDADES, AMENAZAS, cada una con 3-4 puntos concisos.`,
          history: [],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text: string = json.response ?? '';
        // Parsear respuesta de texto del agente en secciones FODA
        const parse = (label: string) => {
          const re = new RegExp(`${label}[:\\s]*\\n([\\s\\S]*?)(?=FORTALEZAS|OPORTUNIDADES|DEBILIDADES|AMENAZAS|$)`, 'i');
          const m = text.match(re);
          if (!m) return [];
          return m[1].split('\n')
            .map(l => l.replace(/^[-•*\d.]+\s*/, '').trim())
            .filter(l => l.length > 10)
            .slice(0, 5);
        };
        const fortalezas   = parse('FORTALEZAS');
        const oportunidades = parse('OPORTUNIDADES');
        const debilidades   = parse('DEBILIDADES');
        const amenazas     = parse('AMENAZAS');

        if (fortalezas.length || oportunidades.length) {
          setData(prev => ({
            ...prev,
            swot: {
              fortalezas:    fortalezas.length    ? fortalezas    : prev.swot.fortalezas,
              oportunidades: oportunidades.length ? oportunidades : prev.swot.oportunidades,
              debilidades:   debilidades.length   ? debilidades   : prev.swot.debilidades,
              amenazas:      amenazas.length      ? amenazas      : prev.swot.amenazas,
            },
          }));
          setSource('ia');
        }
      }
    } catch { /* mantiene datos base */ }
    setGenerating(false);
  };

  const accent = theme.accent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* Banner datos demo */}
      {source === 'base' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,183,3,0.08)', border: '1px solid rgba(255,183,3,0.35)',
          borderRadius: 10, padding: '10px 16px',
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <span style={{ fontWeight: 700, color: '#FFB703', fontSize: 13 }}>Datos de demostración</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 8 }}>
              Este análisis FODA contiene contenido estático de ejemplo. Usa "Regenerar con IA" para obtener un análisis real basado en los datos actuales del portal.
            </span>
          </div>
        </div>
      )}

      <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: -1 }}>🛡️ ANÁLISIS ESTRATÉGICO FODA 2026</h2>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
              background: source === 'ia' ? 'rgba(0,200,150,0.12)' : 'rgba(255,183,3,0.12)',
              color: source === 'ia' ? '#00C896' : '#FFB703',
              border: `1px solid ${source === 'ia' ? 'rgba(0,200,150,0.3)' : 'rgba(255,183,3,0.3)'}`,
            }}>
              {source === 'ia' ? '✦ GENERADO POR IA' : '⚠ CONTENIDO BASE'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: theme.dim, marginTop: 0, marginBottom: 0 }}>
            {source === 'ia'
              ? `Análisis generado en tiempo real por el Director General IA con contexto de ${brand.name}.`
              : 'Contenido base de referencia. Usa "Regenerar con IA" para actualizar con datos reales.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={regenerateWithIA}
            disabled={generating}
            style={{
              background: generating ? 'rgba(0,200,150,0.2)' : 'rgba(0,200,150,0.15)',
              color: generating ? '#00C89680' : '#00C896',
              border: '1px solid rgba(0,200,150,0.3)', borderRadius: 8,
              padding: '10px 16px', fontWeight: 700, cursor: generating ? 'default' : 'pointer', fontSize: 13,
            }}
          >
            {generating ? '⟳ Generando...' : '✦ Regenerar con IA'}
          </button>
          <button
            onClick={() => window.print()}
            style={{ background: accent, color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 800, cursor: 'pointer' }}
          >
            🖨️ Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Fortalezas */}
        <div style={{ background: 'rgba(0, 200, 150, 0.03)', border: `1px solid rgba(0, 200, 150, 0.2)`, borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#00C896', fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💪</span> FORTALEZAS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.swot.fortalezas.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: theme.text, display: 'flex', gap: 10 }}>
                <span style={{ color: '#00C896' }}>▶</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Oportunidades */}
        <div style={{ background: 'rgba(79, 195, 247, 0.03)', border: `1px solid rgba(79, 195, 247, 0.2)`, borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#4FC3F7', fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🚀</span> OPORTUNIDADES
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.swot.oportunidades.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: theme.text, display: 'flex', gap: 10 }}>
                <span style={{ color: '#4FC3F7' }}>▶</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Debilidades */}
        <div style={{ background: 'rgba(255, 183, 3, 0.03)', border: `1px solid rgba(255, 183, 3, 0.2)`, borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#FFB703', fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> DEBILIDADES
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.swot.debilidades.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: theme.text, display: 'flex', gap: 10 }}>
                <span style={{ color: '#FFB703' }}>▶</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Amenazas */}
        <div style={{ background: 'rgba(255, 71, 87, 0.03)', border: `1px solid rgba(255, 71, 87, 0.2)`, borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#FF4757', fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔥</span> AMENAZAS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.swot.amenazas.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: theme.text, display: 'flex', gap: 10 }}>
                <span style={{ color: '#FF4757' }}>▶</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dialogue Transcript */}
      <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.dim, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 }}>
          🎙️ Transcripción de Sesión: Agentes IA
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.dialogue.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <div style={{ 
                minWidth: 100, fontSize: 11, fontWeight: 700, color: m.agente === 'Director General' ? accent : theme.dim,
                textTransform: 'uppercase', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 4, height: 'fit-content'
              }}>
                {m.agente}
              </div>
              <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5, fontStyle: m.agente === 'Director General' ? 'normal' : 'italic' }}>
                "{m.msj}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
