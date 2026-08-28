import { useState } from 'react';
import type { PresenceUser } from '../hooks/usePresence';

const COLORS = [
  '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4',
  '#f97316', '#ec4899', '#84cc16', '#ef4444',
];

function rolColor(rol: string): string {
  const map: Record<string, string> = {
    admin: '#ef4444', director: '#a855f7', noc: '#06b6d4',
    wfm: '#f59e0b', comercial: '#10b981', preventa: '#06b6d4',
    academico: '#a78bfa', tecnico: '#34d399', rrhh: '#ec4899',
  };
  return map[rol] ?? '#6b7280';
}

function initials(nombre: string): string {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

interface Props {
  others: PresenceUser[];
  section: string;
}

export default function PresenceAvatars({ others, section }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (others.length === 0) return null;

  const visible = others.slice(0, 5);
  const extra   = others.length - visible.length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px 8px',
      background: 'rgba(0,168,89,0.06)',
      border: '1px solid rgba(0,168,89,0.2)',
      borderRadius: 20,
    }}>
      {/* Pulse dot */}
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#00A859',
        boxShadow: '0 0 6px #00A859',
        flexShrink: 0,
      }} />

      <span style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>
        {others.length === 1 ? 'También aquí' : `${others.length} aquí`}
      </span>

      {/* Avatars */}
      <div style={{ display: 'flex', position: 'relative' }}>
        {visible.map((u, i) => {
          const color = rolColor(u.rol) ?? COLORS[i % COLORS.length];
          const isHov = hovered === u.id;
          return (
            <div
              key={u.id}
              title={`${u.nombre} · ${u.rol}`}
              onMouseEnter={() => setHovered(u.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative',
                width: 26, height: 26, borderRadius: '50%',
                background: `${color}22`,
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color,
                marginLeft: i === 0 ? 0 : -8,
                zIndex: isHov ? 10 : visible.length - i,
                cursor: 'default',
                transition: 'transform 0.15s, z-index 0s',
                transform: isHov ? 'translateY(-3px) scale(1.15)' : 'none',
              }}
            >
              {initials(u.nombre || u.email)}

              {/* Tooltip */}
              {isHov && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1f2937', border: '1px solid #374151',
                  borderRadius: 6, padding: '5px 9px',
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                  zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f9fafb' }}>
                    {u.nombre}
                  </div>
                  <div style={{ fontSize: 9, color, marginTop: 1 }}>
                    {u.rol} · {u.email.split('@')[0]}
                  </div>
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid #374151',
                  }} />
                </div>
              )}
            </div>
          );
        })}

        {extra > 0 && (
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: '#1f2937', border: '2px solid #374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: '#6b7280',
            marginLeft: -8,
          }}>
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}
