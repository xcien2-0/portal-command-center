import { useAcademia } from './AcademiaLayout';
import { Zap, Flame, Award, TrendingUp, BookOpen } from 'lucide-react';
import { getInitials, getLevelInfo } from '@/lib/academia-utils';

export default function AcademiaDashboard() {
  const { technician } = useAcademia();

  if (!technician) return <div className="text-center py-20 text-gray-400">Cargando técnicos...</div>;

  const skills = technician.skills ?? {};
  const avgSkill = Object.values(skills).length
    ? Math.round(Object.values(skills).reduce((a, b) => a + b, 0) / Object.values(skills).length)
    : 0;
  const levelInfo = getLevelInfo(Math.round(avgSkill / 20));

  const metrics = [
    { label: 'Promedio habilidades', value: `${avgSkill}%`, icon: Zap,       color: '#1B7F4A' },
    { label: 'Especialidad',         value: technician.especialidad,         icon: TrendingUp, color: '#0E6B3A' },
    { label: 'Zona',                 value: technician.zona,                 icon: Flame,      color: '#d97706' },
    { label: 'Status',               value: technician.status,               icon: Award,      color: '#7C3AED' },
  ];

  const skillColors: Record<string, string> = {
    'Instalación':         '#1B7F4A',
    'Soporte':             '#0EA5E9',
    'Seguridad':           '#d97706',
    'Odoo/Admin':          '#7C3AED',
    'Atención al Cliente': '#EA580C',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Hola, {technician.nombre.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{technician.especialidad} · {technician.zona}</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="rounded-2xl p-4 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${m.color}18` }}>
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
              <span className="text-xs text-gray-400 font-medium">{m.label}</span>
            </div>
            <div className="text-xl font-semibold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Habilidades */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
        <h2 className="text-sm font-semibold mb-4">Matriz de habilidades</h2>
        <div className="space-y-3">
          {Object.entries(skills).map(([skill, score]) => (
            <div key={skill}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">{skill}</span>
                <span className="font-semibold" style={{ color: skillColors[skill] ?? '#1B7F4A' }}>{score}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, background: skillColors[skill] ?? '#1B7F4A' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <a href="/academia/examenes" className="rounded-2xl p-5 bg-white flex items-center gap-4 hover:shadow-md transition-shadow" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: '#1B7F4A18' }}>📝</div>
          <div>
            <div className="font-semibold text-sm">Examen Diagnóstico 2026</div>
            <div className="text-xs text-gray-400">Evalúa tus habilidades técnicas</div>
          </div>
        </a>
        <a href="/academia/modulos" className="rounded-2xl p-5 bg-white flex items-center gap-4 hover:shadow-md transition-shadow" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: '#0E6B3A18' }}>📚</div>
          <div>
            <div className="font-semibold text-sm">Biblioteca XCIEN</div>
            <div className="text-xs text-gray-400">Estándares, manuales y protocolos</div>
          </div>
        </a>
      </div>
    </div>
  );
}
