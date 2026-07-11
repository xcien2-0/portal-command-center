export default function ReportesGobierno() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: 400, background: '#0f1117', padding: 40,
      textAlign: 'center', gap: 20,
    }}>
      <div style={{ fontSize: 48 }}>📋</div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 12px', borderRadius: 99,
        background: 'rgba(255,183,3,0.12)', border: '1px solid rgba(255,183,3,0.3)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB703', display: 'inline-block' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#FFB703', letterSpacing: 0.5 }}>
          EN DESARROLLO
        </span>
      </div>
      <div>
        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Reportes de Gobierno
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 8, maxWidth: 480, lineHeight: 1.6 }}>
          Reportes ejecutivos de disponibilidad y cumplimiento SLA para el Gobierno del Estado de Nuevo León.
          Disponibles cuando se conecten los datos reales de NOCBoard + Odoo.
        </p>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, width: '100%', maxWidth: 520,
      }}>
        {[
          { icon: '📊', label: 'Resumen ejecutivo mensual' },
          { icon: '📅', label: 'Tabla de disponibilidad por día' },
          { icon: '⚡', label: 'Registro de incidentes' },
          { icon: '✅', label: 'Cumplimiento SLA' },
          { icon: '📄', label: 'Generación de PDF institucional' },
          { icon: '🗂️', label: 'Historial de reportes' },
        ].map(({ icon, label }) => (
          <div key={label} style={{
            background: '#161b27', border: '1px solid #1e2535',
            borderRadius: 8, padding: '14px 12px',
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ color: '#475569', fontSize: 11, lineHeight: 1.4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
