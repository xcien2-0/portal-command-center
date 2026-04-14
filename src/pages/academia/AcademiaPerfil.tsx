import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAcademia } from './AcademiaLayout';
import {
  getLevelInfo, getNextLevelInfo, getProgressToNextLevel, getInitials,
  PLAZA_LABELS, XP_TYPE_LABELS, formatDate,
} from '@/lib/academia-utils';
import { Award, BookOpen, ClipboardCheck, Ticket } from 'lucide-react';

export default function AcademiaPerfil() {
  const { technician } = useAcademia();
  const [badges, setBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [xpLog, setXpLog] = useState<any[]>([]);
  const [modulesCompleted, setModulesCompleted] = useState(0);
  const [examsPassed, setExamsPassed] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  useEffect(() => {
    if (!technician) return;
    supabase.from('technician_badges').select('badge_id').eq('technician_id', technician.id)
      .then(({ data }) => setBadges(data || []));
    supabase.from('badges').select('*').then(({ data }) => setAllBadges(data || []));
    supabase.from('xp_log').select('*').eq('technician_id', technician.id)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .then(({ data }) => setXpLog(data || []));
    supabase.from('technician_progress').select('id', { count: 'exact' })
      .eq('technician_id', technician.id).eq('completado', true)
      .then(({ count }) => setModulesCompleted(count || 0));
    supabase.from('technician_exam_attempts').select('id', { count: 'exact' })
      .eq('technician_id', technician.id).eq('aprobado', true)
      .then(({ count }) => setExamsPassed(count || 0));
  }, [technician?.id, page]);

  if (!technician) return null;

  const levelInfo = getLevelInfo(technician.nivel);
  const nextLevel = getNextLevelInfo(technician.nivel);
  const progress = getProgressToNextLevel(technician.xp_total, technician.nivel);
  const badgeIds = new Set(badges.map(b => b.badge_id));

  const stats = [
    { label: 'Módulos', value: modulesCompleted, icon: BookOpen },
    { label: 'Exámenes', value: examsPassed, icon: ClipboardCheck },
    { label: 'Badges', value: badges.length, icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="rounded-2xl p-6 bg-white flex flex-col sm:flex-row items-center gap-5" style={{ border: '0.5px solid #e5e7eb' }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold" style={{ background: levelInfo.color }}>
          {getInitials(technician.name)}
        </div>
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-xl font-semibold">{technician.name}</h1>
          <p className="text-sm text-gray-500">{PLAZA_LABELS[technician.plaza]} · {levelInfo.name} (Nv.{technician.nivel})</p>
          <div className="mt-3 w-full max-w-xs">
            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
              <span>{technician.xp_total} XP</span>
              {nextLevel && <span>{nextLevel.xpRequired} XP</span>}
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${progress.progress}%`, background: levelInfo.color }} />
            </div>
            {nextLevel && <p className="text-[11px] text-gray-400 mt-1">{progress.xpNeeded} XP para {nextLevel.name}</p>}
          </div>
        </div>
        <div className="flex gap-4">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-semibold">{s.value}</div>
              <div className="text-[11px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
        <h2 className="text-sm font-semibold mb-4">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allBadges.map(b => {
            const earned = badgeIds.has(b.id);
            return (
              <div key={b.id} className={`rounded-xl p-3 text-center ${earned ? '' : 'opacity-30 grayscale'}`} style={{ border: '0.5px solid #e5e7eb' }}>
                <div className="text-3xl mb-1">🏅</div>
                <div className="text-xs font-semibold">{b.nombre}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{b.descripcion}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* XP History */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
        <h2 className="text-sm font-semibold mb-4">Historial de XP</h2>
        <div className="space-y-2">
          {xpLog.map(log => {
            const typeInfo = XP_TYPE_LABELS[log.tipo] || { label: log.tipo, emoji: '📌' };
            const isPositive = log.puntos > 0;
            return (
              <div key={log.id} className="flex items-center justify-between py-2" style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                <div className="flex items-center gap-2.5">
                  <span>{typeInfo.emoji}</span>
                  <div>
                    <div className="text-sm">{typeInfo.label}</div>
                    <div className="text-[11px] text-gray-400">{formatDate(log.created_at)}</div>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{log.puntos} XP
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-30" style={{ border: '0.5px solid #e5e7eb' }}>
            Anterior
          </button>
          <button disabled={xpLog.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}
            className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-30" style={{ border: '0.5px solid #e5e7eb' }}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
