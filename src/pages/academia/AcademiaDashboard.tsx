import { useEffect, useState } from 'react';
import { MOCK_TECHNICIANS, MOCK_XP_LOG } from '@/data/mockOperationsData';
import { useAcademia } from './AcademiaLayout';
import {
  getLevelInfo, getNextLevelInfo, getProgressToNextLevel, getInitials,
  PLAZA_LABELS, XP_TYPE_LABELS, formatTimeAgo,
} from '@/lib/academia-utils';
import { Zap, Flame, Award, TrendingUp } from 'lucide-react';

export default function AcademiaDashboard() {
  const { technician } = useAcademia();
  const [xpLog, setXpLog] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    if (!technician) return;
    setXpLog(MOCK_XP_LOG.filter(x => x.technician_id === technician.id).slice(0, 5));
    setLeaderboard([...MOCK_TECHNICIANS].sort((a, b) => b.xp_mes_actual - a.xp_mes_actual).slice(0, 5));
    setBadges([]);
  }, [technician?.id]);

  if (!technician) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  const levelInfo = getLevelInfo(technician.nivel);
  const nextLevel = getNextLevelInfo(technician.nivel);
  const progress = getProgressToNextLevel(technician.xp_total, technician.nivel);

  const metrics = [
    { label: 'XP del mes', value: technician.xp_mes_actual, icon: Zap, color: '#1D9E75' },
    { label: 'Nivel', value: levelInfo.name, icon: TrendingUp, color: levelInfo.color },
    { label: 'Racha', value: `${technician.racha_meses_limpios} mes${technician.racha_meses_limpios !== 1 ? 'es' : ''}`, icon: Flame, color: '#ef4444' },
    { label: 'Badges', value: badges.length, icon: Award, color: '#534AB7' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Hola, {technician.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {levelInfo.name} · {PLAZA_LABELS[technician.plaza]}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="rounded-2xl p-4 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${m.color}14` }}>
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
              <span className="text-xs text-gray-400 font-medium">{m.label}</span>
            </div>
            <div className="text-2xl font-semibold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: levelInfo.color }}>
              {technician.nivel}
            </div>
            <span className="text-sm font-medium">{levelInfo.name}</span>
          </div>
          {nextLevel && (
            <span className="text-xs text-gray-400">
              {progress.xpNeeded} XP para {nextLevel.name}
            </span>
          )}
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress.progress}%`, background: levelInfo.color }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[11px] text-gray-400">
          <span>{technician.xp_total} XP</span>
          {nextLevel && <span>{nextLevel.xpRequired} XP</span>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent XP */}
        <div className="lg:col-span-2 rounded-2xl p-5 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-sm font-semibold mb-4">Actividad reciente</h2>
          <div className="space-y-3">
            {xpLog.length === 0 && <p className="text-sm text-gray-400">Sin actividad reciente</p>}
            {xpLog.map(log => {
              const typeInfo = XP_TYPE_LABELS[log.tipo] || { label: log.tipo, emoji: '📌' };
              const isPositive = log.puntos > 0;
              return (
                <div key={log.id} className="flex items-center justify-between py-2" style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{typeInfo.emoji}</span>
                    <div>
                      <div className="text-sm font-medium">{typeInfo.label}</div>
                      <div className="text-[11px] text-gray-400">{formatTimeAgo(log.created_at)}</div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{log.puntos} XP
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mini Leaderboard */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-sm font-semibold mb-4">Top 5 del mes</h2>
          <div className="space-y-2.5">
            {leaderboard.map((t, i) => {
              const li = getLevelInfo(t.nivel);
              const isMe = t.id === technician.id;
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors ${isMe ? 'bg-gray-50' : ''}`}
                  style={isMe ? { border: '1px solid #1D9E75' } : {}}
                >
                  <span className="text-xs font-semibold text-gray-400 w-4 text-center">{i + 1}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-semibold" style={{ background: li.color }}>
                    {getInitials(t.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{t.name}</div>
                    <div className="text-[10px] text-gray-400">{PLAZA_LABELS[t.plaza]}</div>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>{t.xp_mes_actual}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
