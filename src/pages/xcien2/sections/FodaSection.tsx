import { ThemeConfig } from '../types';

export default function FodaSection({ theme }: { theme: ThemeConfig }) {
  const swot = {
    fortalezas: [
      { t: "Cerebro Local Híbrido", d: "Capacidad de operación 100% offline con el motor Antigravity." },
      { t: "Estándares Técnicos", d: "Manuales de instalación corporativos integrados en la Academia." },
      { t: "Red en Vivo (NOC)", d: "Monitoreo de 153 nodos con salud promedio del 77%." },
      { t: "Tokenización", d: "Trazabilidad absoluta de RH y operaciones críticas." }
    ],
    oportunidades: [
      { t: "Migración a Fibra", d: "Up-selling masivo de microondas a infraestructura de fibra." },
      { t: "IA Predictiva", d: "Detección de anomalías en el NOC antes de que el cliente las reporte." },
      { t: "Expansión Regional", d: "Escalabilidad del modelo a nuevas plazas (Saltillo, SLP, Guadalajara)." }
    ],
    debilidades: [
      { t: "Integración Odoo", d: "Dependencia de sincronización manual mientras se libera la API final." },
      { t: "Brecha Técnica", d: "Necesidad de recertificación del 30% del personal en nuevas tecnologías." },
      { t: "Latencia Rural", d: "Zonas con infraestructura antigua requieren inversión prioritaria." }
    ],
    amenazas: [
      { t: "Competencia Satelital", d: "Impacto de Starlink en sectores rurales/residenciales." },
      { t: "Rotación de Talento", d: "Técnicos certificados altamente codiciados por la competencia." },
      { t: "Costos de Energía", d: "Incremento en gastos operativos de nodos core por tarifas eléctricas." }
    ]
  };

  const accent = theme.accent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0 }}>🛡️ ANÁLISIS ESTRATÉGICO FODA (WAR ROOM)</h2>
        <p style={{ fontSize: 13, color: theme.dim, marginTop: 4 }}>Sintetizado por multi-agentes en sesión de Sala de Guerra.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Fortalezas */}
        <div style={{ background: 'rgba(0, 200, 150, 0.05)', border: '1px solid rgba(0, 200, 150, 0.3)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#00C896', fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💪</span> FORTALEZAS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {swot.fortalezas.map((f, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{f.t}</div>
                <div style={{ fontSize: 12, color: theme.dim }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Oportunidades */}
        <div style={{ background: 'rgba(79, 195, 247, 0.05)', border: '1px solid rgba(79, 195, 247, 0.3)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#4FC3F7', fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🚀</span> OPORTUNIDADES
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {swot.oportunidades.map((f, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{f.t}</div>
                <div style={{ fontSize: 12, color: theme.dim }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Debilidades */}
        <div style={{ background: 'rgba(255, 183, 3, 0.05)', border: '1px solid rgba(255, 183, 3, 0.3)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#FFB703', fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> DEBILIDADES
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {swot.debilidades.map((f, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{f.t}</div>
                <div style={{ fontSize: 12, color: theme.dim }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Amenazas */}
        <div style={{ background: 'rgba(255, 71, 87, 0.05)', border: '1px solid rgba(255, 71, 87, 0.3)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#FF4757', fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔥</span> AMENAZAS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {swot.amenazas.map((f, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{f.t}</div>
                <div style={{ fontSize: 12, color: theme.dim }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button 
          onClick={() => window.print()}
          style={{ background: accent, color: '#000', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 800, cursor: 'pointer', boxShadow: `0 0 20px ${accent}40` }}
        >
          🖨️ IMPRIMIR / GUARDAR COMO PDF
        </button>
      </div>
    </div>
  );
}
