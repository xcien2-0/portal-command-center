import { useEffect, useState } from 'react';
import { useAcademia } from './AcademiaLayout';
import { getLevelInfo, getInitials, PLAZA_LABELS } from '@/lib/academia-utils';
import { Trophy, Flame } from 'lucide-react';
import { API_BASE } from '@/config';

export default function AcademiaLeaderboard() {
  const { technician } = useAcademia();
  const [techs, setTechs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [mode, setMode] = useState<'mes' | 'total'>('mes');

  useEffect(() => {
    fetch(`${API_BASE}/api/wfm/tecnicos`)
      .then(res => res.json())
      .then((data: any[]) => {
        const mapped = data.map(t => ({
          id: t.id,
          name: t.nombre,
          plaza: t.zona || 'monterrey',
          nivel: t.nivel ?? 1,
          xp_total: t.xp_total ?? 0,
          xp_mes_actual: t.xp_mes_actual ?? 0,
          racha_meses_limpios: t.racha_meses_limpios ?? 0,
        }));
        const sorted = [...mapped].sort((a, b) =>
          mode === 'mes' ? b.xp_mes_actual - a.xp_mes_actual : b.xp_total - a.xp_total
        );
        setTechs(sorted);
      })
      .catch(() => setTechs([]));
  }, [mode]);

  const plazas = ['all', ...Object.keys(PLAZA_LABELS)];
  const filtered = filter === 'all' ? techs : techs.filter(t => t.plaza === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Trophy className="w-6 h-6" style={{ color: '#eab308' }} /> Leaderboard
        </h1>
        <div className="flex gap-2">
          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
            {(['mes', 'total'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === m ? 'text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
                style={mode === m ? { background: '#1D9E75' } : {}}
              >
                {m === 'mes' ? 'Este mes' : 'Acumulado'}
              </button>
            ))}
          </div>
          {/* Plaza filter */}
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl bg-white" style={{ border: '0.5px solid #e5e7eb' }}
          >
            <option value="all">Todas las plazas</option>
            {Object.entries(PLAZA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
              <th className="px-5 py-3 w-10">#</th>
              <th className="px-5 py-3">Técnico</th>
              <th className="px-5 py-3 hidden sm:table-cell">Plaza</th>
              <th className="px-5 py-3 hidden sm:table-cell">Nivel</th>
              <th className="px-5 py-3 hidden sm:table-cell">Racha</th>
              <th className="px-5 py-3 text-right">XP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const li = getLevelInfo(t.nivel);
              const isMe = t.id === technician?.id;
              return (
                <tr
                  key={t.id}
                  className={`transition-colors ${isMe ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}
                  style={isMe ? { boxShadow: 'inset 3px 0 0 #1D9E75' } : { borderBottom: '0.5px solid #f3f4f6' }}
                >
                  <td className="px-5 py-3">
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : <span className="text-gray-400">{i + 1}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: li.color }}>
                        {getInitials(t.name)}
                      </div>
                      <span className={`font-medium ${isMe ? 'text-emerald-700' : ''}`}>{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{PLAZA_LABELS[t.plaza]}</td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: li.color }}>
                      {li.name}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    {t.racha_meses_limpios > 0 && (
                      <span className="flex items-center gap-1 text-xs text-orange-500">
                        <Flame className="w-3 h-3" />{t.racha_meses_limpios}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold" style={{ color: '#1D9E75' }}>
                    {mode === 'mes' ? t.xp_mes_actual : t.xp_total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
