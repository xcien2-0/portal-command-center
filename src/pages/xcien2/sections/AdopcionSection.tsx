import { ThemeConfig } from '../types';
import { useState, useEffect } from 'react';
import { API_BASE } from '../../../config';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'pending';
  lastSeen: string;
}

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Jesús Morales', email: 'j.morales@xcien.com', role: 'Director General', department: 'Dirección', status: 'active', lastSeen: 'Hoy, 09:15' },
  { id: '2', name: 'Ana Rodríguez', email: 'a.rodriguez@xcien.com', role: 'Líder Técnico', department: 'Operaciones', status: 'active', lastSeen: 'Ayer, 18:30' },
  { id: '3', name: 'Carlos Mendoza', email: 'c.mendoza@xcien.com', role: 'Técnico Especialista', department: 'Operaciones', status: 'active', lastSeen: 'Hoy, 10:45' },
];

export default function AdopcionSection({ theme }: { theme: ThemeConfig }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', department: 'Planeación', role: 'Analista' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const accent = theme.accent;

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        fetchUsers();
        setNewUser({ name: '', email: '', department: 'Planeación', role: 'Analista' });
        setShowAdd(false);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0 }}>👥 ADOPCIÓN & GESTIÓN DE USUARIOS</h2>
          <p style={{ fontSize: 13, color: theme.dim, marginTop: 4 }}>Expansión estratégica de la plataforma hacia áreas de planeación y gerencia.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          style={{ 
            background: accent, color: '#000', border: 'none', borderRadius: 8, 
            padding: '8px 16px', fontWeight: 700, cursor: 'pointer',
            fontSize: 13
          }}
        >
          {showAdd ? '✕ Cancelar' : '+ Invitar Usuario'}
        </button>
      </div>

      {showAdd && (
        <div style={{ background: theme.card, border: `1px solid ${accent}40`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: accent }}>Nuevo Enlace Estratégico</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Nombre Completo</label>
              <input 
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                placeholder="Ej: Ing. Roberto Garza"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, borderRadius: 6, padding: 10, color: theme.text, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Correo Corporativo</label>
              <input 
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                placeholder="usuario@xcien.com"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, borderRadius: 6, padding: 10, color: theme.text, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Departamento</label>
              <select 
                value={newUser.department}
                onChange={e => setNewUser({...newUser, department: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, borderRadius: 6, padding: 10, color: theme.text, outline: 'none' }}
              >
                <option value="Planeación">Planeación</option>
                <option value="Gerencia">Gerencia</option>
                <option value="Operaciones">Operaciones</option>
                <option value="Finanzas">Finanzas</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Rol en Plataforma</label>
              <select 
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, borderRadius: 6, padding: 10, color: theme.text, outline: 'none' }}
              >
                <option value="Analista">Analista</option>
                <option value="Auditor">Auditor</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Técnico">Técnico</option>
              </select>
            </div>
          </div>
          <button 
            onClick={handleAddUser}
            style={{ alignSelf: 'flex-end', background: accent, color: '#000', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 800, cursor: 'pointer' }}
          >
            Enviar Invitación
          </button>
        </div>
      )}

      {/* Adoption Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Tasa de Adopción', val: '68%', desc: '+12% este mes' },
          { label: 'Sesiones Activas', val: '24', desc: 'En tiempo real' },
          { label: 'Áreas Conectadas', val: '4/6', desc: 'Planeación pendiente' },
        ].map((s, i) => (
          <div key={i} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: accent, margin: '4px 0' }}>{s.val}</div>
            <div style={{ fontSize: 12, color: theme.dim }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* User Table */}
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}`, background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Usuario</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Departamento</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Rol</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background 0.2s' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: theme.dim }}>{u.email}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: 12, color: theme.text, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                    {u.department}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: 13, color: theme.dim }}>{u.role}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                    color: u.status === 'active' ? accent : '#FFB703',
                    background: u.status === 'active' ? `${accent}10` : '#FFB70310',
                    padding: '4px 8px', borderRadius: 4, border: `1px solid ${u.status === 'active' ? accent : '#FFB703'}30`
                  }}>
                    {u.status === 'active' ? 'Activo' : 'Pendiente'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {u.status === 'pending' ? (
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/invite?id=${u.id}`;
                        navigator.clipboard.writeText(link);
                        alert('Enlace de invitación copiado al portapapeles');
                      }}
                      style={{ background: 'transparent', border: `1px solid ${accent}`, color: accent, borderRadius: 4, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                    >
                      🔗 COPIAR ENLACE
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: theme.dim }}>{u.lastSeen || 'Hoy'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: `${accent}05`, border: `1px dashed ${accent}40`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: theme.dim, margin: 0 }}>
          💡 **Consejo de Adopción:** Al invitar usuarios de Planeación, el sistema habilitará automáticamente el acceso a la Sala de Guerra y reportes de Gerencia.
        </p>
      </div>
    </div>
  );
}
