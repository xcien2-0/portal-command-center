import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAcademia } from './AcademiaLayout';
import { getLevelInfo, getInitials, PLAZA_LABELS, XP_TYPE_LABELS, formatDate } from '@/lib/academia-utils';
import { toast } from 'sonner';
import { Users, BookOpen, Zap, Search } from 'lucide-react';

export default function AcademiaAdmin() {
  const { isSupervisor } = useAcademia();
  const [tab, setTab] = useState<'techs' | 'xp'>('techs');
  const [techs, setTechs] = useState<any[]>([]);
  const [xpLogs, setXpLogs] = useState<any[]>([]);
  const [xpFilter, setXpFilter] = useState({ tech: '', type: '' });
  const [showXpForm, setShowXpForm] = useState(false);
  const [xpForm, setXpForm] = useState({ technician_id: '', tipo: 'ticket_ok', puntos: 15, referencia_id: '' });

  useEffect(() => {
    supabase.from('technicians').select('*').not('plaza', 'is', null).order('name')
      .then(({ data }) => setTechs(data || []));
    fetchXpLogs();
  }, []);

  const fetchXpLogs = () => {
    let q = supabase.from('xp_log').select('*, technicians(name)').order('created_at', { ascending: false }).limit(50);
    supabase.from('xp_log').select('*, technicians(name)').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setXpLogs(data || []));
  };

  const handleAddXp = async () => {
    if (!xpForm.technician_id) return toast.error('Selecciona un técnico');
    const { error } = await supabase.from('xp_log').insert({
      technician_id: xpForm.technician_id,
      tipo: xpForm.tipo as any,
      puntos: xpForm.puntos,
      referencia_id: xpForm.referencia_id || null,
    });
    if (error) toast.error('Error: ' + error.message);
    else {
      toast.success(`XP registrado: ${xpForm.puntos > 0 ? '+' : ''}${xpForm.puntos}`);
      setShowXpForm(false);
      fetchXpLogs();
    }
  };

  if (!isSupervisor) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-semibold text-gray-900">Acceso restringido</h2>
        <p className="text-sm text-gray-500 mt-1">Activa el modo Supervisor en el selector de técnico</p>
      </div>
    );
  }

  const filteredLogs = xpLogs.filter(l => {
    if (xpFilter.tech && !(l.technicians as any)?.name?.toLowerCase().includes(xpFilter.tech.toLowerCase())) return false;
    if (xpFilter.type && l.tipo !== xpFilter.type) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel de administración</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'techs', label: 'Técnicos', icon: Users },
          { key: 'xp', label: 'Log de XP', icon: Zap },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key ? 'text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
            style={tab === t.key ? { background: '#1D9E75' } : { border: '0.5px solid #e5e7eb' }}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'techs' && (
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                <th className="px-5 py-3">Técnico</th>
                <th className="px-5 py-3">Plaza</th>
                <th className="px-5 py-3">Nivel</th>
                <th className="px-5 py-3">XP Total</th>
                <th className="px-5 py-3">XP Mes</th>
                <th className="px-5 py-3">Racha</th>
              </tr>
            </thead>
            <tbody>
              {techs.map(t => {
                const li = getLevelInfo(t.nivel);
                return (
                  <tr key={t.id} className="hover:bg-gray-50" style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-semibold" style={{ background: li.color }}>
                          {getInitials(t.name)}
                        </div>
                        {t.name}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{PLAZA_LABELS[t.plaza]}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: li.color }}>{li.name}</span>
                    </td>
                    <td className="px-5 py-3 font-medium">{t.xp_total}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: '#1D9E75' }}>{t.xp_mes_actual}</td>
                    <td className="px-5 py-3">{t.racha_meses_limpios > 0 ? `🔥 ${t.racha_meses_limpios}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'xp' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar técnico..."
                value={xpFilter.tech}
                onChange={e => setXpFilter(p => ({ ...p, tech: e.target.value }))}
                className="text-xs bg-transparent outline-none w-32"
              />
            </div>
            <select
              value={xpFilter.type}
              onChange={e => setXpFilter(p => ({ ...p, type: e.target.value }))}
              className="text-xs px-3 py-1.5 rounded-xl bg-white" style={{ border: '0.5px solid #e5e7eb' }}
            >
              <option value="">Todos los tipos</option>
              {Object.entries(XP_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowXpForm(!showXpForm)}
              className="ml-auto text-xs px-4 py-1.5 rounded-xl text-white font-medium"
              style={{ background: '#534AB7' }}
            >
              + Registrar XP
            </button>
          </div>

          {showXpForm && (
            <div className="rounded-2xl p-5 bg-white space-y-3" style={{ border: '0.5px solid #e5e7eb' }}>
              <h3 className="text-sm font-semibold">Registrar evento de XP</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <select value={xpForm.technician_id} onChange={e => setXpForm(p => ({ ...p, technician_id: e.target.value }))}
                  className="text-sm p-2 rounded-xl" style={{ border: '0.5px solid #e5e7eb' }}>
                  <option value="">Seleccionar técnico</option>
                  {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select value={xpForm.tipo} onChange={e => setXpForm(p => ({ ...p, tipo: e.target.value }))}
                  className="text-sm p-2 rounded-xl" style={{ border: '0.5px solid #e5e7eb' }}>
                  {Object.entries(XP_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.emoji} {v.label}</option>
                  ))}
                </select>
                <input type="number" value={xpForm.puntos} onChange={e => setXpForm(p => ({ ...p, puntos: parseInt(e.target.value) || 0 }))}
                  placeholder="Puntos" className="text-sm p-2 rounded-xl" style={{ border: '0.5px solid #e5e7eb' }} />
                <input type="text" value={xpForm.referencia_id} onChange={e => setXpForm(p => ({ ...p, referencia_id: e.target.value }))}
                  placeholder="Referencia (opcional)" className="text-sm p-2 rounded-xl" style={{ border: '0.5px solid #e5e7eb' }} />
              </div>
              <button onClick={handleAddXp} className="px-5 py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#1D9E75' }}>
                Guardar
              </button>
            </div>
          )}

          <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                  <th className="px-5 py-3">Técnico</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Puntos</th>
                  <th className="px-5 py-3">Ref</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const typeInfo = XP_TYPE_LABELS[log.tipo] || { label: log.tipo, emoji: '📌' };
                  return (
                    <tr key={log.id} className="hover:bg-gray-50" style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                      <td className="px-5 py-2.5">{(log.technicians as any)?.name || '—'}</td>
                      <td className="px-5 py-2.5">{typeInfo.emoji} {typeInfo.label}</td>
                      <td className={`px-5 py-2.5 font-semibold ${log.puntos > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {log.puntos > 0 ? '+' : ''}{log.puntos}
                      </td>
                      <td className="px-5 py-2.5 text-gray-400 text-xs">{log.referencia_id || '—'}</td>
                      <td className="px-5 py-2.5 text-gray-400 text-xs">{formatDate(log.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
