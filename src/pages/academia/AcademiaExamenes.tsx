import { useEffect, useState } from 'react';
import { useAcademia } from './AcademiaLayout';
import { API_BASE } from '@/config';
import { getLevelInfo } from '@/lib/academia-utils';
import { CheckCircle2, XCircle, ClipboardCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AcademiaExamenes() {
  const { technician } = useAcademia();
  const [exams, setExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fetchData = () => {
    if (!technician) return;
    // Mock exams derived from available docs — no DB yet
    setExams([
      { id: 'e1', titulo: 'Proceso de Soporte HL', calificacion_minima: 70, max_intentos: 3, xp_primer_intento: 50, xp_reintento: 25, academy_modules: { titulo: 'Estándares Operativos', nivel_requerido: 1 } },
      { id: 'e2', titulo: 'Protocolo NOC', calificacion_minima: 80, max_intentos: 3, xp_primer_intento: 75, xp_reintento: 40, academy_modules: { titulo: 'Operaciones de Red', nivel_requerido: 1 } },
    ]);
    setAttempts([]);
  };

  useEffect(fetchData, [technician?.id]);

  const getExamStatus = (exam: any) => {
    const examAttempts = attempts.filter(a => a.exam_id === exam.id);
    const passed = examAttempts.some(a => a.aprobado);
    const attemptsUsed = examAttempts.length;
    const available = !passed && attemptsUsed < exam.max_intentos;
    const moduleLvl = exam.academy_modules?.nivel_requerido || 1;
    const locked = moduleLvl > (technician?.nivel || 1);
    return { passed, attemptsUsed, available, locked, examAttempts };
  };

  const startExam = async (exam: any) => {
    setActiveExam(exam);
    setCurrentQ(0);
    setAnswers({});
    setShowFeedback(false);
    setResult(null);
    try {
      // Ask the backend to generate quiz questions from local docs
      const res = await fetch(`${API_BASE}/api/academia/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: exam.titulo, num_preguntas: 5 }),
      });
      const data = await res.json();
      // Map backend format to local format
      const qs = (data.preguntas || []).map((q: any, i: number) => ({
        id: String(i),
        pregunta: q.pregunta,
        opciones: q.opciones,
        respuesta_correcta: q.respuesta_correcta,
        explicacion: q.explicacion || '',
      }));
      setQuestions(qs.length > 0 ? qs : fallbackQuestions(exam));
    } catch {
      setQuestions(fallbackQuestions(exam));
    }
  };

  const fallbackQuestions = (exam: any) => [
    { id: '0', pregunta: `¿Cuál es el primer paso en el protocolo ${exam.titulo}?`, opciones: ['Identificar el problema', 'Escalar inmediatamente', 'Cerrar el ticket', 'Ignorar la alerta'], respuesta_correcta: 0, explicacion: 'Siempre se debe identificar primero el problema.' },
    { id: '1', pregunta: 'Cuando un cliente reporta pérdida de servicio, ¿cuál es el SLA estándar de respuesta?', opciones: ['30 minutos', '4 horas', '24 horas', '1 hora'], respuesta_correcta: 3, explicacion: 'El SLA de respuesta estándar para pérdida de servicio es 1 hora.' },
  ];

  const selectAnswer = (qIdx: number, ansIdx: number) => {
    if (showFeedback) return;
    setAnswers(prev => ({ ...prev, [qIdx]: ansIdx }));
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    if (!technician || !activeExam) return;
    const correct = questions.reduce((sum, q, i) => sum + (answers[i] === q.respuesta_correcta ? 1 : 0), 0);
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= activeExam.calificacion_minima;
    const examAttempts = attempts.filter((a: any) => a.exam_id === activeExam.id);
    const attemptNum = examAttempts.length + 1;
    const isFirst = attemptNum === 1;
    const xp = passed ? (isFirst ? activeExam.xp_primer_intento : activeExam.xp_reintento) : 0;

    // Record attempt in local state — no backend write endpoint yet
    setAttempts(prev => [...prev, {
      id: crypto.randomUUID(),
      technician_id: technician.id,
      exam_id: activeExam.id,
      calificacion: score,
      aprobado: passed,
      intento_num: attemptNum,
      created_at: new Date().toISOString(),
    }]);

    setResult({ score, passed, xp, attemptNum });
    if (passed) toast.success(`🎓 Examen aprobado — +${xp} XP`);
    else toast.error(`Examen reprobado — ${score}%`);
  };

  if (!technician) return null;

  // Result screen
  if (result) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${result.passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {result.passed ? <CheckCircle2 className="w-10 h-10 text-emerald-500" /> : <XCircle className="w-10 h-10 text-red-500" />}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-1">{result.passed ? '¡Aprobado!' : 'No aprobado'}</h2>
          <p className="text-gray-500">Calificación: {result.score}%</p>
        </div>
        {result.xp > 0 && (
          <div className="text-3xl font-bold" style={{ color: '#1D9E75' }}>+{result.xp} XP</div>
        )}
        <button onClick={() => { setActiveExam(null); setResult(null); }} className="px-6 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: '#1D9E75' }}>
          Volver a exámenes
        </button>
      </div>
    );
  }

  // Active exam view
  if (activeExam && questions.length > 0) {
    const q = questions[currentQ];
    const opciones = typeof q.opciones === 'string' ? JSON.parse(q.opciones) : q.opciones;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => setActiveExam(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Salir del examen
        </button>
        {/* Progress */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{currentQ + 1}/{questions.length}</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, background: '#1D9E75' }} />
          </div>
        </div>
        <div className="rounded-2xl p-6 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-base font-semibold mb-5">{q.pregunta}</h2>
          <div className="space-y-2.5">
            {(opciones as string[]).map((opt: string, i: number) => {
              const selected = answers[currentQ] === i;
              const isCorrect = i === q.respuesta_correcta;
              let borderColor = '#e5e7eb';
              let bg = 'white';
              if (showFeedback && selected && isCorrect) { borderColor = '#1D9E75'; bg = '#f0fdf4'; }
              if (showFeedback && selected && !isCorrect) { borderColor = '#ef4444'; bg = '#fef2f2'; }
              if (showFeedback && !selected && isCorrect) { borderColor = '#1D9E75'; bg = '#f0fdf4'; }
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(currentQ, i)}
                  disabled={showFeedback}
                  className="w-full text-left p-3.5 rounded-xl text-sm transition-all"
                  style={{ border: `1.5px solid ${borderColor}`, background: bg }}
                >
                  <span className="font-medium mr-2 text-gray-400">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {showFeedback && q.explicacion && (
            <div className="mt-4 p-3 rounded-xl bg-blue-50 text-sm text-blue-700" style={{ border: '0.5px solid #bfdbfe' }}>
              💡 {q.explicacion}
            </div>
          )}
          {showFeedback && (
            <button onClick={nextQuestion} className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2" style={{ background: '#1D9E75' }}>
              {currentQ < questions.length - 1 ? 'Siguiente' : 'Ver resultado'} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Exam list
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Exámenes</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map(exam => {
          const status = getExamStatus(exam);
          const moduleLvl = exam.academy_modules?.nivel_requerido || 1;
          const li = getLevelInfo(moduleLvl);
          return (
            <div key={exam.id} className={`rounded-2xl p-5 bg-white ${status.locked ? 'opacity-50' : ''}`} style={{ border: status.passed ? '1.5px solid #1D9E75' : '0.5px solid #e5e7eb' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#534AB714' }}>
                  <ClipboardCheck className="w-5 h-5" style={{ color: '#534AB7' }} />
                </div>
                {status.passed && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
              </div>
              <h3 className="text-sm font-semibold mb-1">{exam.titulo}</h3>
              <p className="text-[11px] text-gray-400 mb-3">{exam.academy_modules?.titulo}</p>
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3">
                <span style={{ color: li.color }}>Nv.{moduleLvl}</span>
                <span>Intentos: {status.attemptsUsed}/{exam.max_intentos}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mb-4">
                <span className="text-gray-400">Mín: {exam.calificacion_minima}%</span>
                <span style={{ color: '#1D9E75' }}>+{exam.xp_primer_intento} XP</span>
              </div>
              {status.locked ? (
                <div className="text-center text-xs text-gray-400 py-2">🔒 Nivel {moduleLvl} requerido</div>
              ) : status.passed ? (
                <div className="text-center text-xs text-emerald-600 font-medium py-2">✅ Aprobado</div>
              ) : status.available ? (
                <button onClick={() => startExam(exam)} className="w-full py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#534AB7' }}>
                  {status.attemptsUsed > 0 ? 'Reintentar' : 'Iniciar examen'}
                </button>
              ) : (
                <div className="text-center text-xs text-red-500 py-2">Sin intentos restantes</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
