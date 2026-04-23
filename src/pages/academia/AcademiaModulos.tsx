import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAcademia } from './AcademiaLayout';
import { getLevelInfo } from '@/lib/academia-utils';
import { Lock, CheckCircle2, Play, FileText, Wrench, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const tipoIcons: Record<string, any> = { video: Play, documento: FileText, practica: Wrench };
const tipoColors: Record<string, string> = { video: '#1D9E75', documento: '#534AB7', practica: '#d97706' };

export default function AcademiaModulos() {
  const { technician } = useAcademia();
  const [modules, setModules] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<any | null>(null);

  const fetchData = () => {
    if (!technician) return;
    supabase.from('academy_modules').select('*').order('nivel_requerido').order('orden')
      .then(({ data }) => data && setModules(data));
    supabase.from('technician_progress').select('*').eq('technician_id', technician.id)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, any> = {};
          data.forEach(p => { map[p.module_id] = p; });
          setProgress(map);
        }
      });
  };

  useEffect(fetchData, [technician?.id]);

  const handleComplete = async (mod: any) => {
    if (!technician) return;
    const { error } = await supabase.from('technician_progress').insert({
      technician_id: technician.id,
      module_id: mod.id,
      completado: true,
      fecha_completado: new Date().toISOString(),
      xp_ganado: mod.xp_otorga,
    });
    if (!error) {
      await supabase.from('xp_log').insert({
        technician_id: technician.id,
        tipo: 'modulo' as any,
        puntos: mod.xp_otorga,
        referencia_id: mod.id,
      });
      toast.success(`+${mod.xp_otorga} XP — Módulo completado`, { description: mod.titulo });
      fetchData();
      setSelected(null);
    }
  };

  if (!technician) return null;

  if (selected) {
    const isCompleted = !!progress[selected.id]?.completado;
    const Icon = tipoIcons[selected.tipo] || FileText;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a módulos
        </button>
        <div className="rounded-2xl p-6 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tipoColors[selected.tipo]}14` }}>
              <Icon className="w-5 h-5" style={{ color: tipoColors[selected.tipo] }} />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{selected.titulo}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: tipoColors[selected.tipo] }}>
                {selected.tipo}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{selected.descripcion}</p>
          <div className="rounded-xl bg-gray-50 p-8 text-center text-gray-400 text-sm mb-6" style={{ border: '0.5px solid #e5e7eb' }}>
            📄 Contenido del módulo (iframe / link de recurso externo)
          </div>
          {isCompleted ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5" /> Módulo completado — +{progress[selected.id].xp_ganado} XP
            </div>
          ) : (
            <button
              onClick={() => handleComplete(selected)}
              className="w-full py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
              style={{ background: '#1D9E75' }}
            >
              Marcar como completado (+{selected.xp_otorga} XP)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Módulos de capacitación</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(mod => {
          const locked = mod.nivel_requerido > technician.nivel;
          const completed = !!progress[mod.id]?.completado;
          const Icon = tipoIcons[mod.tipo] || FileText;
          const li = getLevelInfo(mod.nivel_requerido);
          return (
            <button
              key={mod.id}
              disabled={locked}
              onClick={() => !locked && setSelected(mod)}
              className={`text-left rounded-2xl p-5 bg-white transition-all ${
                locked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
              }`}
              style={{ border: completed ? '1.5px solid #1D9E75' : '0.5px solid #e5e7eb' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tipoColors[mod.tipo]}14` }}>
                  {locked ? <Lock className="w-5 h-5 text-gray-300" /> : <Icon className="w-5 h-5" style={{ color: tipoColors[mod.tipo] }} />}
                </div>
                {completed && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              </div>
              <h3 className="text-sm font-semibold mb-1">{mod.titulo}</h3>
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{mod.descripcion}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-white" style={{ background: tipoColors[mod.tipo] }}>
                  {mod.tipo}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span className="font-medium" style={{ color: li.color }}>Nv.{mod.nivel_requerido}</span>
                  <span>+{mod.xp_otorga} XP</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
