import { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';

interface Props { theme: ThemeConfig }

interface Tecnico {
  id: number;
  name: string;
  job_title: string;
}

interface HoloQuestion {
  id: number;
  pilar: string;
  pregunta: string;
  opciones: string[];
  respuesta_correcta: number;
}

interface HoloQuizData {
  titulo: string;
  tiempo_limite: number;
  pilares: string[];
  preguntas: HoloQuestion[];
}

export default function AcademiaHoloSection({ theme }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(true);
  const [selectedTecnico, setSelectedTecnico] = useState<Tecnico | null>(null);
  
  const [quizData, setQuizData] = useState<HoloQuizData | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number; pct: number; approved: boolean } | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/odoo/tecnicos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTecnicos(data);
          if (data.length > 0) setSelectedTecnico(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingTecnicos(false));
  }, []);

  const startExam = async () => {
    if (!selectedTecnico) return;
    setStep(2);
    setLoadingQuiz(true);
    try {
      const res = await fetch('http://localhost:8000/api/diagnostic_exam');
      const data = await res.json();
      setQuizData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleNext = () => {
    if (!quizData || answers[qIndex] === undefined) return;
    if (qIndex < quizData.preguntas.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    if (!quizData) return;
    let correct = 0;
    quizData.preguntas.forEach((q, i) => {
      if (answers[i] === q.respuesta_correcta) correct++;
    });
    const total = quizData.preguntas.length;
    const pct = Math.round((correct / total) * 100);
    const approved = pct >= 70;
    
    setScore({ correct, total, pct, approved });
    setStep(3);

    try {
      await fetch('http://localhost:8000/api/save_skill_result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_tecnico: selectedTecnico?.name, resultados: { "Global": pct } })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ── CSS nativo de la UI Holográfica ──
  const styles = `
    .holo-container { font-family: 'Inter', sans-serif; padding: 20px; color: #d8f8e8; background: #000905; min-height: 100%; }
    .holo-card { background: rgba(0,8,4,0.88); border: 1px solid rgba(0,255,136,0.15); border-radius: 8px; overflow: hidden; max-width: 600px; margin: 0 auto; box-shadow: 0 0 20px rgba(0,255,136,0.05); }
    .p-header { display: flex; align-items: center; gap: 8px; padding: 14px 20px; border-bottom: 1px solid rgba(0,255,136,0.15); background: rgba(0,255,136,0.02); }
    .p-dot { width: 6px; height: 6px; border-radius: 50%; }
    .p-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .p-body { padding: 24px; }
    
    .m-pos-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
    .m-pos-item:hover { background: rgba(255,255,255,0.02); }
    .m-pos-item.active { border-color: rgba(0,255,136,0.4); background: rgba(0,255,136,0.05); }
    .m-pos-item.active .m-name { color: #00ff88; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .m-pos-item.active .m-role { color: #00ff88; }
    .m-name { font-size: 13px; color: #9ca3af; }
    .m-role { font-size: 11px; color: #3a6050; }
    
    .m-btn { margin-top: 24px; text-align: center; padding: 16px; border: 1px solid rgba(0,255,136,0.5); border-radius: 8px; color: #00ff88; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; font-weight: 700; text-shadow: 0 0 10px rgba(0,255,136,0.3); }
    .m-btn:hover { background: rgba(0,255,136,0.1); box-shadow: 0 0 20px rgba(0,255,136,0.3); transform: translateY(-2px); }
    .m-btn.disabled { opacity: 0.3; cursor: not-allowed; border-color: rgba(255,255,255,0.1); color: #555; text-shadow: none; }
    
    .m-progress { height: 4px; background: rgba(0,255,136,0.1); margin: 12px 0 32px; border-radius: 2px; }
    .m-progress-fill { height: 100%; background: #00ff88; box-shadow: 0 0 10px #00ff88; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 2px; }
    
    .m-tag { font-size: 11px; font-weight: 700; letter-spacing: 2px; margin-bottom: 16px; color: rgba(0,255,136,0.6); }
    .m-q { font-size: 20px; color: #fff; line-height: 1.45; margin-bottom: 32px; font-weight: 600; text-shadow: 0 0 15px rgba(0,255,136,0.2); }
    
    .m-opt { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); font-size: 16px; color: #d8f8e8; }
    .m-opt:hover { border-color: rgba(0,170,255,0.4); background: rgba(0,170,255,0.08); transform: translateX(8px); color: #fff; }
    .m-opt.sel { border-color: #00aaff; background: rgba(0,170,255,0.15); color: #fff; box-shadow: 0 0 20px rgba(0,170,255,0.1); }
    .m-letter { width: 32px; height: 32px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #888; transition: all 0.2s; }
    .m-letter.sel { background: rgba(0,170,255,0.25); color: #00aaff; border-color: #00aaff; box-shadow: 0 0 10px rgba(0,170,255,0.3); }
    
    .cert-view { margin-top: 32px; border: 1px solid rgba(0,255,136,0.2); padding: 32px; border-radius: 8px; text-align: center; background: linear-gradient(180deg, rgba(0,255,136,0.05) 0%, transparent 100%); position: relative; overflow: hidden; }
    .cert-view::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #00ff88, transparent); }
    .cert-title { font-size: 24px; color: #00ff88; font-family: 'JetBrains Mono', monospace; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.5px; text-shadow: 0 0 15px rgba(0,255,136,0.4); }
  `;

  return (
    <div className="holo-container">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00ff88', letterSpacing: '-0.5px', textShadow: '0 0 20px rgba(0,255,136,0.3)', margin: 0 }}>Academia Holo</h1>
        <p style={{ color: '#3a6050', fontSize: 13, marginTop: 8 }}>Módulo de Certificación Técnica</p>
      </div>

      {step === 1 && (
        <div className="holo-card">
          <div className="p-header">
            <div className="p-dot" style={{ background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
            <div className="p-title" style={{ color: 'rgba(0,255,136,0.7)' }}>1 — Selección de Técnico (Odoo)</div>
          </div>
          <div className="p-body">
            {loadingTecnicos ? (
              <div style={{ textAlign: 'center', color: '#3a6050', padding: 20, fontSize: 12 }}>Cargando técnicos...</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {tecnicos.map(t => (
                  <div key={t.id} className={`m-pos-item ${selectedTecnico?.id === t.id ? 'active' : ''}`} onClick={() => setSelectedTecnico(t)}>
                    <span className="m-name">{t.name}</span>
                    <span className="m-role">Odoo · {t.job_title} {selectedTecnico?.id === t.id && '●'}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={`m-btn ${!selectedTecnico ? 'disabled' : ''}`} onClick={startExam}>
              Iniciar Examen Teórico →
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="holo-card" style={{ borderColor: 'rgba(0,170,255,0.15)', boxShadow: '0 0 20px rgba(0,170,255,0.05)' }}>
          <div className="p-header" style={{ borderBottomColor: 'rgba(0,170,255,0.15)', background: 'rgba(0,170,255,0.02)' }}>
            <div className="p-dot" style={{ background: '#00aaff', boxShadow: '0 0 6px #00aaff' }} />
            <div className="p-title" style={{ color: 'rgba(0,170,255,0.7)' }}>2 — Examen Teórico</div>
          </div>
          <div className="p-body">
            {loadingQuiz || !quizData ? (
              <div style={{ textAlign: 'center', color: '#00aaff', padding: 40, fontSize: 12 }}>Conectando con el Banco Maestro...</div>
            ) : (
              (() => {
                const q = quizData.preguntas[qIndex];
                const total = quizData.preguntas.length;
                const pct = Math.round((qIndex / total) * 100);
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: 'rgba(0,170,255,0.5)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>PREGUNTA {qIndex + 1} DE {total}</span>
                      <span style={{ fontSize: 9, color: 'rgba(0,170,255,0.8)', fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                    </div>
                    <div className="m-progress" style={{ background: 'rgba(0,170,255,0.1)' }}>
                      <div className="m-progress-fill" style={{ width: `${pct}%`, background: '#00aaff', boxShadow: '0 0 8px #00aaff' }} />
                    </div>
                    
                    <div className="m-tag" style={{ color: 'rgba(0,170,255,0.7)' }}>{q.pilar.toUpperCase()} · Evaluación Holo</div>
                    <div className="m-q">{q.pregunta}</div>
                    
                    {q.opciones.map((opt, i) => (
                      <div key={i} className={`m-opt ${answers[qIndex] === i ? 'sel' : ''}`} onClick={() => setAnswers({ ...answers, [qIndex]: i })}>
                        <div className={`m-letter ${answers[qIndex] === i ? 'sel' : ''}`}>{String.fromCharCode(65 + i)}</div>
                        {opt}
                      </div>
                    ))}
                    
                    <div className={`m-btn ${answers[qIndex] === undefined ? 'disabled' : ''}`} style={{ color: '#00aaff', borderColor: 'rgba(0,170,255,0.4)' }} onClick={handleNext}>
                      {qIndex < total - 1 ? 'Siguiente →' : 'Finalizar y Calificar'}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {step === 3 && score && (
        <div className="holo-card" style={{ borderColor: 'rgba(170,102,255,0.15)', boxShadow: '0 0 20px rgba(170,102,255,0.05)' }}>
          <div className="p-header" style={{ borderBottomColor: 'rgba(170,102,255,0.15)', background: 'rgba(170,102,255,0.02)' }}>
            <div className="p-dot" style={{ background: '#aa66ff', boxShadow: '0 0 6px #aa66ff' }} />
            <div className="p-title" style={{ color: 'rgba(170,102,255,0.7)' }}>3 — Resultados y Certificación</div>
          </div>
          <div className="p-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'rgba(170,102,255,0.7)', letterSpacing: 1, marginBottom: 20 }}>RESULTADOS · ODOO SYNC</div>
            
            <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: score.approved ? '#00ff88' : '#ff3366', textShadow: `0 0 20px ${score.approved ? '#00ff88' : '#ff3366'}`, marginBottom: 8 }}>
              {score.pct}%
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 32 }}>
              {score.correct} aciertos de {score.total} preguntas
            </div>
            
            {score.approved ? (
              <div className="cert-view">
                <div style={{ fontSize: 10, color: '#3a6050', letterSpacing: 2, marginBottom: 12 }}>CERTIFICADO DE COMPETENCIA</div>
                <div className="cert-title">{selectedTecnico?.name}</div>
                <div style={{ fontSize: 13, color: '#00ff88' }}>{selectedTecnico?.job_title}</div>
                <div style={{ marginTop: 24, fontSize: 11, color: '#3a6050' }}>Validado por IA · {new Date().toLocaleDateString()}</div>
              </div>
            ) : (
              <div style={{ padding: 24, background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.2)', borderRadius: 8, color: '#ff3366', fontSize: 14 }}>
                Evaluación reprobada. Se requiere un mínimo de 70% para certificar.
              </div>
            )}
            
            <div className="m-btn" style={{ color: '#aa66ff', borderColor: 'rgba(170,102,255,0.4)', marginTop: 32 }} onClick={() => { setStep(1); setScore(null); setAnswers({}); setQIndex(0); }}>
              Volver al inicio
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
