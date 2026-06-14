import { ThemeConfig } from '../types';
import { useState, useEffect } from 'react';
import { API_BASE } from '../../../config';
import brand from '../../../brand';

interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  plaza: string;
  activo: boolean;
  creado_en: string;
  ultimo_login: string | null;
}

const ROL_LABELS: Record<string, string> = {
  admin: 'Administrador', director: 'Director', noc: 'Analista NOC',
  wfm: 'Coordinador WFM', comercial: 'Comercial', academico: 'Academia',
  tecnico: 'Técnico', readonly: 'Solo lectura',
};

export default function AdopcionSection({ theme }: { theme: ThemeConfig }) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', password: '', plaza: 'Monterrey', rol: 'readonly' });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/usuarios`);
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.warn('No se pudo cargar lista de usuarios', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const accent = theme.accent;

  const handleAddUser = async () => {
    if (!newUser.nombre || !newUser.email || !newUser.password) {
      setError('Nombre, correo y contraseña son obligatorios'); return;
    }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        await fetchUsers();
        setNewUser({ nombre: '', email: '', password: '', plaza: 'Monterrey', rol: 'readonly' });
        setShowAdd(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail ?? 'Error al crear usuario');
      }
    } catch { setError('Error de conexión'); }
    setSaving(false);
  };

  const activeCount = users.filter(u => u.activo).length;
  const roles = [...new Set(users.map(u => u.rol))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0 }}>👥 GESTIÓN DE USUARIOS DEL PORTAL</h2>
          <p style={{ fontSize: 13, color: theme.dim, marginTop: 4 }}>
            Usuarios registrados en el sistema de autenticación · {loading ? '…' : `${users.length} total, ${activeCount} activos`}
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setError(''); }}
          style={{ background: accent, color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
        >
          {showAdd ? '✕ Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {showAdd && (
        <div style={{ background: theme.card, border: `1px solid ${accent}40`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: accent }}>Crear usuario del portal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {([
              { label: 'Nombre Completo', key: 'nombre', placeholder: 'Ej: Ing. Roberto Garza', type: 'text' },
              { label: 'Correo', key: 'email', placeholder: `usuario@${brand.emailDomain}`, type: 'email' },
              { label: 'Contraseña inicial', key: 'password', placeholder: '••••••••', type: 'password' },
              { label: 'Plaza', key: 'plaza', placeholder: 'Monterrey', type: 'text' },
            ] as const).map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={newUser[f.key]}
                  onChange={e => setNewUser({ ...newUser, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, borderRadius: 6, padding: 10, color: theme.text, outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Rol</label>
              <select
                value={newUser.rol}
                onChange={e => setNewUser({ ...newUser, rol: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, borderRadius: 6, padding: 10, color: theme.text, outline: 'none' }}
              >
                {Object.entries(ROL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {error && <div style={{ color: '#FF6B6B', fontSize: 13, padding: '8px 12px', background: 'rgba(255,80,80,0.08)', borderRadius: 6 }}>{error}</div>}
          <button
            onClick={handleAddUser}
            disabled={saving}
            style={{ alignSelf: 'flex-end', background: saving ? `${accent}60` : accent, color: '#000', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 800, cursor: saving ? 'default' : 'pointer' }}
          >
            {saving ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      )}

      {/* Métricas reales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Usuarios Totales', val: loading ? '…' : String(users.length), desc: 'Registrados en el sistema' },
          { label: 'Usuarios Activos', val: loading ? '…' : String(activeCount), desc: 'Con acceso habilitado' },
          { label: 'Roles Distintos', val: loading ? '…' : String(roles.length), desc: roles.join(', ') },
        ].map((s, i) => (
          <div key={i} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: accent, margin: '4px 0' }}>{s.val}</div>
            <div style={{ fontSize: 12, color: theme.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Tabla de usuarios reales */}
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.dim }}>Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.dim }}>Sin usuarios registrados</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {['Usuario', 'Plaza', 'Rol', 'Estado', 'Último acceso'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>{u.nombre}</div>
                    <div style={{ fontSize: 12, color: theme.dim }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: theme.dim }}>{u.plaza || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: accent, background: `${accent}10`, padding: '3px 8px', borderRadius: 4 }}>
                      {ROL_LABELS[u.rol] ?? u.rol}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      color: u.activo ? '#00C896' : '#FF6B6B',
                      background: u.activo ? 'rgba(0,200,150,0.1)' : 'rgba(255,80,80,0.1)',
                      padding: '3px 8px', borderRadius: 4,
                    }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: theme.dim }}>
                    {u.ultimo_login
                      ? new Date(u.ultimo_login).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                      : 'Nunca'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
