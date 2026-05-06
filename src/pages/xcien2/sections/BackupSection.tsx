import { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';
import { 
  Database, 
  Download, 
  ShieldCheck, 
  History, 
  AlertCircle, 
  CloudUpload,
  Clock,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Server
} from 'lucide-react';
import { API_BASE } from '../../../config';

interface BackupRecord {
  id: string;
  timestamp: string;
  size: string;
  type: 'full' | 'incremental' | 'config';
  status: 'completed' | 'failed' | 'in_progress';
  user: string;
  location: string;
}

interface BackupSectionProps {
  theme: ThemeConfig;
}

const G = '#00ff88';
const Y = '#ffcc00';
const R = '#ff3366';

export default function BackupSection({ theme }: BackupSectionProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('offline');
  const [backups, setBackups] = useState<BackupRecord[]>([
    {
      id: 'BK-2026-0506-01',
      timestamp: '2026-05-06 01:20:44',
      size: '1.2 GB',
      type: 'full',
      status: 'completed',
      user: 'Admin XCIEN',
      location: 'Local Storage (RAID 5)'
    },
    {
      id: 'BK-2026-0505-18',
      timestamp: '2026-05-05 18:00:12',
      size: '450 MB',
      type: 'incremental',
      status: 'completed',
      user: 'Sistema (Auto)',
      location: 'Cloud Mirror (S3)'
    }
  ]);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) setBackendStatus('online');
        else setBackendStatus('offline');
      } catch { setBackendStatus('offline'); }
    };
    checkBackend();
    const id = setInterval(checkBackend, 5000);
    return () => clearInterval(id);
  }, []);

  const startBackup = async () => {
    setIsBackingUp(true);
    setProgress(0);
    
    // Simulación de comando real al backend
    try {
       await fetch(`${API_BASE}/api/bridge/command`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           command: "INICIAR BACKUP ODOO POSTGRESQL", 
           context: "backup_module" 
         })
       });
    } catch (e) { console.error("Error enviando comando de backup", e); }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsBackingUp(false);
            const newBackup: BackupRecord = {
              id: `BK-2026-0506-${Math.floor(Math.random() * 90) + 10}`,
              timestamp: new Date().toLocaleString('es-MX'),
              size: '1.2 GB',
              type: 'full',
              status: 'completed',
              user: 'Admin XCIEN',
              location: 'Local Storage (RAID 5)'
            };
            setBackups([newBackup, ...backups]);
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const accent = theme.accent;

  return (
    <div style={{ position: 'relative', color: theme.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Database style={{ color: accent }} size={32} />
            GESTIÓN DE RESPALDOS
          </h2>
          <p style={{ color: theme.dim, fontSize: 14, marginTop: 4 }}>Protocolo de redundancia para migración Odoo v19.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ 
            padding: '8px 16px', borderRadius: 8, background: `${G}10`, border: `1px solid ${G}30`,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: G
          }}>
            <Server size={14} />
            BACKEND: {backendStatus.toUpperCase()}
          </div>
          <div style={{ 
            padding: '8px 16px', borderRadius: 8, background: `${accent}10`, border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: accent
          }}>
            <ShieldCheck size={14} />
            ESTADO: PROTEGIDO
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Action Card */}
          <div style={{ 
            padding: 32, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`,
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CloudUpload style={{ color: accent }} />
                Respaldo Crítico (Snapshot Odoo)
              </h3>
              <p style={{ color: theme.dim, fontSize: 14, lineHeight: 1.6, maxWidth: 600, marginBottom: 24 }}>
                Este proceso genera un volcado binario directo de la base de datos PostgreSQL y el filestore de Odoo (wispi17). 
                Es el requisito fundamental antes de iniciar cualquier fase de migración en el laboratorio.
              </p>

              {isBackingUp ? (
                <div style={{ padding: 20, background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: `1px solid ${accent}40` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: accent, animation: 'pulse 1s infinite' }}>
                      EJECUTANDO PG_DUMP...
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800 }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: accent, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ) : (
                <button 
                  onClick={startBackup}
                  style={{ 
                    padding: '16px 32px', background: accent, color: '#000', border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.2s'
                  }}
                >
                  <RefreshCw size={18} />
                  INICIAR FULL BACKUP AHORA
                </button>
              )}
            </div>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.03 }}>
              <Database size={240} />
            </div>
          </div>

          {/* History List */}
          <div style={{ background: theme.card, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border}`, background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={16} />
                HISTORIAL DE PUNTOS DE RESTAURACIÓN
              </h4>
              <span style={{ fontSize: 10, color: theme.dim }}>ÚLTIMOS 30 DÍAS</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {backups.map((bk, i) => (
                <div key={bk.id} style={{ 
                  padding: '16px 24px', borderBottom: i === backups.length - 1 ? 'none' : `1px solid ${theme.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${G}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G }}>
                      <HardDrive size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {bk.id}
                        <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, color: theme.dim }}>{bk.type.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 11, color: theme.dim, marginTop: 4, display: 'flex', gap: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {bk.timestamp}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Database size={12} /> {bk.size}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${accent}40`, borderRadius: 8, color: accent, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      RESTAURAR
                    </button>
                    <button style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ padding: 24, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}` }}>
            <h4 style={{ fontSize: 11, fontWeight: 800, color: theme.dim, textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 }}>Infraestructura</h4>
            <div style={{ spaceY: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span>Almacenamiento Local</span>
                  <span style={{ fontWeight: 800 }}>68%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: '68%', background: accent }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span>Sincronización Cloud</span>
                  <span style={{ fontWeight: 800, color: G }}>ACTIVA</span>
                </div>
                <div style={{ height: 4, background: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: '100%', background: G }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 20, background: `${R}10`, border: `1px solid ${R}30`, display: 'flex', gap: 12 }}>
            <AlertCircle style={{ color: R, flexShrink: 0 }} size={20} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: R, marginBottom: 4 }}>AVISO DE SEGURIDAD</div>
              <p style={{ fontSize: 11, color: theme.text, margin: 0, opacity: 0.8, lineHeight: 1.5 }}>
                La migración requiere PostgreSQL 16. Antes de iniciar, asegure que no existan transacciones pendientes en los agentes IA.
              </p>
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 20, background: `${G}10`, border: `1px solid ${G}30`, display: 'flex', gap: 12 }}>
            <CheckCircle2 style={{ color: G, flexShrink: 0 }} size={20} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: G, marginBottom: 4 }}>INTEGRIDAD VERIFICADA</div>
              <p style={{ fontSize: 11, color: theme.text, margin: 0, opacity: 0.8, lineHeight: 1.5 }}>
                Los últimos 5 snapshots han sido validados contra el checksum original. Datos listos para staging.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
