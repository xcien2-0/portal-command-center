import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap, Shield, BarChart3, Users, Monitor, Bot, FileText, Building2, ArrowRight, Check, Phone, Mail, Calendar } from 'lucide-react';

const TOTAL_SLIDES = 7;
const NAVY = 'hsl(210, 53%, 23%)';
const TEAL = 'hsl(160, 70%, 37%)';

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((idx: number) => {
    if (isAnimating || idx === current || idx < 0 || idx >= TOTAL_SLIDES) return;
    setDirection(idx > current ? 'right' : 'left');
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 500);
  }, [current, isAnimating]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const slides = [
    <SlidePortada key={0} onStart={next} />,
    <SlideProblema key={1} />,
    <SlideSolucion key={2} />,
    <SlideComoFunciona key={3} />,
    <SlideResultados key={4} />,
    <SlidePricing key={5} />,
    <SlideProximosPasos key={6} />,
  ];

  return (
    <div ref={containerRef} className="h-screen w-full overflow-hidden flex flex-col" style={{ background: NAVY }}>
      {/* Progress bar */}
      <div className="h-1 w-full bg-white/10 shrink-0">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%`, background: TEAL }}
        />
      </div>

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-all duration-500 ease-out"
            style={{
              opacity: i === current ? 1 : 0,
              transform: i === current ? 'translateX(0)' : i < current ? 'translateX(-8%)' : 'translateX(8%)',
              pointerEvents: i === current ? 'auto' : 'none',
            }}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-black/20 backdrop-blur-sm">
        <button
          onClick={prev}
          disabled={current === 0}
          className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
          <span className="text-white/40 text-xs font-mono tabular-nums">{current + 1} / {TOTAL_SLIDES}</span>
        </div>

        <button
          onClick={next}
          disabled={current === TOTAL_SLIDES - 1}
          className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ==================== SLIDE COMPONENTS ==================== */

function SlideContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`h-full w-full flex items-center justify-center p-8 md:p-16 ${className}`}>
      <div className="w-full max-w-5xl mx-auto">
        {children}
      </div>
    </div>
  );
}

function SlidePortada({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${TEAL}, transparent 70%)` }} />

      <div className="text-center relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs tracking-widest uppercase mb-4">
          <Zap className="w-3 h-3" style={{ color: TEAL }} /> Plataforma de IA
        </div>
        <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
          ISP<span style={{ color: TEAL }}>ilot</span>
        </h1>
        <p className="text-xl md:text-2xl text-white/60 font-light">
          Opera más. Interviene menos.
        </p>
        <p className="text-sm text-white/40 max-w-md mx-auto">
          La plataforma de IA para ISPs empresariales en México
        </p>
        <button
          onClick={onStart}
          className="mt-8 inline-flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium transition-all hover:brightness-110 hover:scale-105"
          style={{ background: TEAL }}
        >
          Ver presentación <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SlideProblema() {
  const pains = [
    { icon: Bot, title: 'Soporte técnico', desc: '60% de tickets resueltos manualmente' },
    { icon: Monitor, title: 'NOC', desc: 'Se enteran del fallo cuando el cliente llama' },
    { icon: FileText, title: 'Gobierno', desc: 'Reportes mensuales toman 2 días de trabajo' },
  ];

  return (
    <SlideContainer>
      <div className="space-y-12">
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: TEAL }}>El problema</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight max-w-3xl">
            Sus operaciones crecen. Sus equipos también.
            <span className="text-white/40"> ¿Y si no tuviera que elegir?</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {pains.map((p, i) => (
            <div key={i} className="group p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: `${TEAL}20` }}>
                <p.icon className="w-5 h-5" style={{ color: TEAL }} />
              </div>
              <h3 className="text-white font-semibold mb-2">{p.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SlideContainer>
  );
}

function SlideSolucion() {
  const modules = [
    { icon: Shield, title: 'NOC con IA', desc: 'Detección predictiva de fallos antes de que ocurran' },
    { icon: Bot, title: 'Soporte 24/7', desc: 'Resolución automática de tickets nivel L1' },
    { icon: Users, title: 'Portal Empresarial', desc: 'Self-serve para sus clientes corporativos' },
    { icon: FileText, title: 'Reportes Gobierno', desc: 'Generación automática en formato oficial' },
  ];

  return (
    <SlideContainer>
      <div className="space-y-12">
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: TEAL }}>La solución</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight max-w-3xl">
            ISPilot automatiza lo repetitivo.
            <span className="text-white/40"> Su equipo resuelve lo importante.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {modules.map((m, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${TEAL}15` }}>
                <m.icon className="w-6 h-6" style={{ color: TEAL }} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">{m.title}</h3>
                <p className="text-white/50 text-sm">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideContainer>
  );
}

function SlideComoFunciona() {
  const steps = [
    { num: '1', title: 'Conectamos con su Odoo actual', desc: 'API REST estándar, sin migración de datos' },
    { num: '2', title: 'Activamos los módulos que necesita', desc: 'Configuración modular en menos de 48 horas' },
    { num: '3', title: 'Sus clientes y equipo tienen acceso', desc: 'Portal en vivo con capacitación incluida' },
  ];

  return (
    <SlideContainer>
      <div className="space-y-12">
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: TEAL }}>Cómo funciona</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Se integra con Odoo en días,
            <span className="text-white/40"> no meses.</span>
          </h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 relative">
              <div className="p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all h-full">
                <div className="text-4xl font-bold mb-3" style={{ color: TEAL }}>{s.num}</div>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-white/20" />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-white/30 text-sm italic">
          Sin migración de datos. Sin reemplazar lo que funciona.
        </p>
      </div>
    </SlideContainer>
  );
}

function SlideResultados() {
  const metrics = [
    { value: '-65%', label: 'tiempo de resolución de soporte' },
    { value: '99.9%', label: 'uptime documentado para gobierno' },
    { value: '-40%', label: 'carga operativa del equipo NOC' },
  ];

  return (
    <SlideContainer>
      <div className="space-y-12">
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: TEAL }}>Resultados esperados</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            ROI en los primeros
            <span style={{ color: TEAL }}> 90 días</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className="text-center p-8 rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="text-5xl md:text-6xl font-bold mb-3" style={{ color: TEAL }}>{m.value}</div>
              <p className="text-white/60 text-sm">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-white/25 text-xs">
          Basado en benchmarks de ISPs similares en LATAM
        </p>
      </div>
    </SlideContainer>
  );
}

function SlidePricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$8,500',
      features: ['Portal Empresarial', 'Soporte IA (L1)', 'Integración Odoo básica', 'Hasta 200 clientes'],
      highlight: false,
    },
    {
      name: 'Profesional',
      price: '$15,000',
      features: ['Todo en Starter', 'NOC con IA', 'Facturación automática', 'Hasta 1,000 clientes', 'Soporte prioritario'],
      highlight: true,
    },
    {
      name: 'Gobierno',
      price: '$22,000',
      features: ['Todo en Profesional', 'Reportes gubernamentales', 'CFDI automáticos', 'SLA dedicado', 'Auditoría incluida'],
      highlight: false,
    },
  ];

  return (
    <SlideContainer>
      <div className="space-y-10">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: TEAL }}>Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Modular. <span className="text-white/40">Crece con usted.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl p-6 flex flex-col transition-all ${plan.highlight
                ? 'border-2 bg-white/[0.06] scale-105'
                : 'border border-white/10 bg-white/[0.03]'
              }`}
              style={plan.highlight ? { borderColor: TEAL } : {}}
            >
              {plan.highlight && (
                <div className="text-[10px] uppercase tracking-widest font-semibold mb-3 px-2 py-0.5 rounded-full self-start" style={{ background: `${TEAL}20`, color: TEAL }}>
                  Más popular
                </div>
              )}
              <h3 className="text-white font-bold text-lg">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold" style={{ color: TEAL }}>{plan.price}</span>
                <span className="text-white/40 text-sm"> MXN/mes</span>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-white/60">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: TEAL }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 w-full py-2.5 rounded-lg text-sm font-medium transition-all ${plan.highlight
                  ? 'text-white hover:brightness-110'
                  : 'border border-white/20 text-white hover:bg-white/10'
                }`}
                style={plan.highlight ? { background: TEAL } : {}}
              >
                Solicitar demo
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-white/30 text-xs">
          Todos los planes incluyen integración con Odoo
        </p>
      </div>
    </SlideContainer>
  );
}

function SlideProximosPasos() {
  const timeline = [
    { week: 'Semana 1', task: 'Integración con su Odoo' },
    { week: 'Semana 2', task: 'Portal activo para 5 clientes piloto' },
    { week: 'Semana 3', task: 'NOC en vivo con sus nodos' },
    { week: 'Semana 4', task: 'Primera demo con su cliente de gobierno' },
  ];

  return (
    <SlideContainer>
      <div className="space-y-10">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: TEAL }}>Próximos pasos</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Empecemos con un piloto de
            <span style={{ color: TEAL }}> 30 días</span>
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-4 bottom-4 w-px" style={{ background: `${TEAL}40` }} />
            <div className="space-y-6">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 bg-white/5 relative z-10" style={{ borderColor: TEAL }}>
                    <span className="text-xs font-bold" style={{ color: TEAL }}>{i + 1}</span>
                  </div>
                  <div className="pt-1.5">
                    <span className="text-xs uppercase tracking-wider text-white/40">{t.week}</span>
                    <p className="text-white font-medium">{t.task}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-white font-semibold text-lg transition-all hover:brightness-110 hover:scale-105"
            style={{ background: TEAL }}
          >
            <Calendar className="w-5 h-5" /> Agendar llamada de 30 min
          </button>
          <div className="flex items-center justify-center gap-6 text-white/40 text-sm">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> contacto@ispilot.mx</span>
            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> +52 81 1234 5678</span>
          </div>
        </div>
      </div>
    </SlideContainer>
  );
}
