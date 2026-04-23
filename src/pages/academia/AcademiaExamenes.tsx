import { useEffect, useState } from 'react';
import { useAcademia } from './AcademiaLayout';
import { CheckCircle2, XCircle, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API = 'http://localhost:8000/api';

interface Question {
  id: number;
  pilar: string;
  pregunta: string;
  opciones: string[];
  respuesta_correcta: number;
  explicacion: string;
}

interface Exam {
  titulo: string;
  tiempo_limite: number;
  pilares: string[];
  preguntas: Question[];
}

const PILAR_COLORS: Record<string, string> = {
  'Instalación':         '#1B7F4A',
  'Soporte':             '#0EA5E9',
  'Seguridad':           '#d97706',
  'Odoo/Admin':          '#7C3AED',
  'Atención al Cliente': '#EA580C',
};

export default function AcademiaExamenes() {
  const { technician } = useAcademia();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<Record<string, { correct: number; total: number }>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/diagnostic_exam`)
      .then(r => r.json())
      .then(data => { setExam(data); setTimeLeft(data.tiempo_limite * 60); })
      .catch(() => toast.error('No se pudo cargar el examen. Verifica que Antigravity esté corriendo.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!started || finished || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); finishExam(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [started, finished, timeLeft]);

  const selectAnswer = (idx: number) => {
    if (showFeedback) return;
    setAnswers(prev => ({ ...prev, [currentQ]: idx }));
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    if (!exam) return;
    if (currentQ < exam.preguntas.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    if (!exam) return;
    const r: Record<string, { correct: number; total: number }> = {};
    exam.preguntas.forEach((q, i) => {
      if (!r[q.pilar]) r[q.pilar] = { correct: 0, total: 0 };
      r[q.pilar].total++;
      if (answers[i] === q.respuesta_correcta) r[q.pilar].correct++;
    });
    setResults(r);
    setFinished(true);
    if (technician) {
      const resultados: Record<string, number> = {};
      Object.entries(r).forEach(([pilar, v]) => {
        resultados[pilar] = Math.round((v.correct / v.total) * 100);
      });
      fetch(`${API}/save_skill_result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_tecnico: technician.nombre, resultados }),
      }).catch(() => {});
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const resetExam = () => {
    if (!exam) return;
    setStarted(false); setFinished(false);
    setCurrentQ(0); setAnswers({});
    setShowFeedback(false);
    setTimeLeft(exam.tiempo_limite * 60);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Cargando examen...</div>;

  if (!exam) return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-4xl mb-3">⚠️</div>
      <p>No se pudo conectar con Antigravity.</p>
      <p className="text-sm mt-1">Verifica que el servidor esté corriendo en localhost:8000</p>
    </div>
  );

  // Resultados
  if (finished) {
    const total = Object.values(results).reduce((a, b) => a + b.correct, 0);
    const totalQ = Object.values(results).reduce((a, b) => a + b.total, 0);
    const pct = Math.round((total / totalQ) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl p-8 bg-white text-center" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="text-5xl mb-4">{pct >= 90 ? '🏆' : pct >= 70 ? '✅' : '📚'}</div>
          <h1 className="text-3xl font-bold mb-1">{pct}%</h1>
          <p className="text-gray-500 text-sm mb-4">{total} de {totalQ} respuestas correctas</p>
          <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-white" style={{ background: pct >= 90 ? '#1B7F4A' : pct >= 70 ? '#d97706' : '#ef4444' }}>
            {pct >= 90 ? '🎓 Certificado' : pct >= 70 ? 'Aprobado' : 'Necesita refuerzo'}
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-sm font-semibold mb-4">Resultados por pilar</h2>
          <div className="space-y-3">
            {Object.entries(results).map(([pilar, v]) => {
              const p = Math.round((v.correct / v.total) * 100);
              return (
                <div key={pilar}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{pilar}</span>
                    <span className="font-semibold" style={{ color: PILAR_COLORS[pilar] ?? '#1B7F4A' }}>{p}% ({v.correct}/{v.total})</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p}%`, background: PILAR_COLORS[pilar] ?? '#1B7F4A' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={resetExam} className="w-full py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity" style={{ background: '#1B7F4A' }}>
          Volver a intentar
        </button>
      </div>
    );
  }

  // Pantalla de inicio
  if (!started) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl p-8 bg-white text-center" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-xl font-bold mb-2">{exam.titulo}</h1>
          <p className="text-gray-500 text-sm mb-6">
            {exam.preguntas.length} preguntas · {exam.tiempo_limite} minutos
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {exam.pilares.map(p => (
              <span key={p} className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: PILAR_COLORS[p] ?? '#1B7F4A' }}>{p}</span>
            ))}
          </div>
          <button onClick={() => setStarted(true)} className="w-full py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity" style={{ background: '#1B7F4A' }}>
            Iniciar examen
          </button>
        </div>
      </div>
    );
  }

  // Examen activo
  const q = exam.preguntas[currentQ];
  const selected = answers[currentQ];
  const isCorrect = selected === q.respuesta_correcta;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400 font-medium">{currentQ + 1} / {exam.preguntas.length}</span>
        <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: timeLeft < 300 ? '#ef4444' : '#1B7F4A' }}>
          <Clock className="w-4 h-4" />{formatTime(timeLeft)}
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: PILAR_COLORS[q.pilar] ?? '#1B7F4A' }}>{q.pilar}</span>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / exam.preguntas.length) * 100}%`, background: '#1B7F4A' }} />
      </div>

      <div className="rounded-2xl p-6 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
        <h2 className="text-base font-semibold leading-snug mb-5">{q.pregunta}</h2>
        <div className="space-y-2.5">
          {q.opciones.map((op, i) => {
            let borderColor = '#e5e7eb';
            if (showFeedback) {
              if (i === q.respuesta_correcta) borderColor = '#1B7F4A';
              else if (i === selected && !isCorrect) borderColor = '#ef4444';
            }
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                disabled={showFeedback}
                className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all hover:bg-gray-50 disabled:hover:bg-white"
                style={{ border: `1.5px solid ${borderColor}` }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gray-100 text-gray-500">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{op}</span>
                  {showFeedback && i === q.respuesta_correcta && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#1B7F4A' }} />}
                  {showFeedback && i === selected && !isCorrect && <XCircle className="w-4 h-4 shrink-0 text-red-500" />}
                </div>
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className="mt-4 p-3 rounded-xl text-sm leading-relaxed" style={{ background: isCorrect ? '#1B7F4A12' : '#ef444412', border: `1px solid ${isCorrect ? '#1B7F4A' : '#ef4444'}` }}>
            <span className="font-semibold" style={{ color: isCorrect ? '#1B7F4A' : '#ef4444' }}>
              {isCorrect ? '✓ Correcto' : '✗ Incorrecto'} —{' '}
            </span>
            {q.explicacion}
          </div>
        )}
      </div>

      {showFeedback && (
        <button onClick={nextQuestion} className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity" style={{ background: '#1B7F4A' }}>
          {currentQ < exam.preguntas.length - 1 ? (<>Siguiente <ArrowRight className="w-4 h-4" /></>) : 'Ver resultados'}
        </button>
      )}
    </div>
  );
}
