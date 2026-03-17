import { useState } from 'react';
import { MessageCircle, FileText, Wifi, ShoppingCart, BarChart3, ChevronRight, CheckCircle2, AlertTriangle, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StepStatus = 'pending' | 'active' | 'completed';

interface OnboardingStep {
  day: string;
  title: string;
  icon: React.ReactNode;
  channel: string;
  messages: { type: 'sent' | 'received' | 'system' | 'branch_ok' | 'branch_fail'; text: string }[];
  actions?: string[];
}

const STEPS: OnboardingStep[] = [
  {
    day: 'Día 1',
    title: 'Bienvenida y registro',
    icon: <MessageCircle className="h-5 w-5" />,
    channel: 'WhatsApp',
    messages: [
      {
        type: 'sent',
        text: '¡Bienvenido a la familia Coco! 🎉\n\nSoy tu asistente de activación.\n\nEn los próximos 7 días te guío para tener internet en tu comunidad.\n\nEmpecemos: ¿cuántas casas tiene tu comunidad?',
      },
      { type: 'received', text: 'Como 45 casas, más o menos' },
      {
        type: 'system',
        text: 'Claude registra dato en Odoo → campo x_casas_comunidad = 45',
      },
    ],
    actions: ['Trigger: Afiliado nuevo en Odoo', 'Claude personaliza mensaje de bienvenida', 'Se registra respuesta en CRM'],
  },
  {
    day: 'Día 2',
    title: 'Guía de instalación',
    icon: <FileText className="h-5 w-5" />,
    channel: 'WhatsApp',
    messages: [
      {
        type: 'sent',
        text: '¡Hola! Hoy toca preparar tu Coco Box 📦\n\nTe envío todo lo que necesitas:',
      },
      { type: 'system', text: '📄 PDF: Instrucciones de instalación Coco Box' },
      { type: 'system', text: '🎬 Video tutorial: youtube.com/coco-install' },
      { type: 'system', text: '✅ Checklist de instalación (7 pasos)' },
      { type: 'received', text: 'Ya lo descargué, mañana lo instalo' },
    ],
    actions: ['Envía PDF de instalación', 'Link a video tutorial', 'Checklist interactivo de instalación'],
  },
  {
    day: 'Día 3',
    title: 'Verificación técnica',
    icon: <Wifi className="h-5 w-5" />,
    channel: 'NOC + WhatsApp',
    messages: [
      { type: 'system', text: 'NOC verifica: ¿Coco Box online?' },
      {
        type: 'branch_ok',
        text: '¡Tu Coco Box está activa! 🟢\nYa puedes vender planes a tu comunidad.\nTe envío tu kit de ventas →',
      },
      {
        type: 'branch_fail',
        text: 'Vemos que tu Coco Box aún no conecta 🔴\nYa escalamos a un técnico de campo.\nTe contactará en las próximas 2 horas.',
      },
    ],
    actions: ['NOC confirma estado de la caja', 'Si online → activa kit de ventas', 'Si offline → escala a técnico de campo'],
  },
  {
    day: 'Día 7',
    title: 'Primera venta',
    icon: <ShoppingCart className="h-5 w-5" />,
    channel: 'WhatsApp',
    messages: [
      { type: 'system', text: 'Odoo verifica: ¿tiene ventas registradas?' },
      {
        type: 'branch_ok',
        text: '¡Felicidades! 🎊 Primera venta registrada.\nTu comisión de $150 MXN ya está en camino.\n\nSigue así, cada venta cuenta.',
      },
      {
        type: 'branch_fail',
        text: '¡Ánimo! Aquí van tips para tu primera venta:\n\n📌 Mejor horario: 6-8pm (cuando la gente llega)\n📌 Ofrece prueba gratis de 1 hora\n📌 Te envío materiales de marketing para WhatsApp ↓',
      },
    ],
    actions: ['Verifica ventas en Odoo', 'Si vendió → confirma comisión', 'Si no vendió → tips + materiales marketing'],
  },
  {
    day: 'Día 30',
    title: 'Revisión de desempeño',
    icon: <BarChart3 className="h-5 w-5" />,
    channel: 'WhatsApp + Claude',
    messages: [
      { type: 'system', text: 'Claude genera reporte personalizado del afiliado' },
      {
        type: 'sent',
        text: '📊 Tu reporte del primer mes:\n\n• Usuarios conectados: 23\n• Ventas totales: 18 planes\n• Comisión acumulada: $2,700 MXN\n• Plan más vendido: Básico 10Mbps\n\n💡 Recomendación: Promueve el plan Familiar, tu comunidad tiene alto uso en las noches. Mejor horario de ventas: 5-7pm.',
      },
    ],
    actions: ['Claude analiza datos de Odoo + NOC', 'Genera reporte personalizado', 'Recomienda plan y horario óptimo'],
  },
];

function MessageBubble({ msg }: { msg: OnboardingStep['messages'][0] }) {
  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-1.5">
        <span className="text-[10px] bg-accent text-muted-foreground px-2.5 py-1 rounded-full">{msg.text}</span>
      </div>
    );
  }
  if (msg.type === 'branch_ok') {
    return (
      <div className="flex gap-2 items-start my-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-status-ok mt-0.5 shrink-0" />
        <div className="bg-status-ok/10 border border-status-ok/20 rounded-lg px-3 py-2 text-[11px] whitespace-pre-line max-w-[85%]">
          {msg.text}
        </div>
      </div>
    );
  }
  if (msg.type === 'branch_fail') {
    return (
      <div className="flex gap-2 items-start my-1">
        <AlertTriangle className="h-3.5 w-3.5 text-status-warning mt-0.5 shrink-0" />
        <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg px-3 py-2 text-[11px] whitespace-pre-line max-w-[85%]">
          {msg.text}
        </div>
      </div>
    );
  }
  const isSent = msg.type === 'sent';
  return (
    <div className={`flex ${isSent ? 'justify-start' : 'justify-end'} my-1`}>
      <div
        className={`rounded-lg px-3 py-2 text-[11px] whitespace-pre-line max-w-[85%] ${
          isSent
            ? 'bg-primary/15 border border-primary/20 text-foreground'
            : 'bg-accent border border-border text-foreground'
        }`}
      >
        {isSent && <p className="text-[9px] text-primary font-semibold mb-0.5">🤖 Coco Bot</p>}
        {!isSent && <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">👤 Afiliado</p>}
        {msg.text}
      </div>
    </div>
  );
}

export default function CocoOnboarding() {
  const [activeStep, setActiveStep] = useState(0);
  const [simStatuses, setSimStatuses] = useState<StepStatus[]>(STEPS.map((_, i) => (i === 0 ? 'active' : 'pending')));

  const advanceStep = () => {
    setSimStatuses(prev => {
      const next = [...prev];
      next[activeStep] = 'completed';
      if (activeStep + 1 < STEPS.length) next[activeStep + 1] = 'active';
      return next;
    });
    if (activeStep < STEPS.length - 1) setActiveStep(activeStep + 1);
  };

  const resetSim = () => {
    setActiveStep(0);
    setSimStatuses(STEPS.map((_, i) => (i === 0 ? 'active' : 'pending')));
  };

  const step = STEPS[activeStep];

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div>
          <h1 className="text-sm font-semibold">Onboarding — Nueva Comunidad</h1>
          <p className="text-[10px] text-muted-foreground">Flujo automatizado n8n + Claude + WhatsApp · Tenant: coco</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={resetSim}>Reiniciar</Button>
          <Button size="sm" className="text-[10px] h-6 px-2" onClick={advanceStep} disabled={activeStep >= STEPS.length - 1 && simStatuses[activeStep] === 'completed'}>
            Simular siguiente <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Timeline sidebar */}
        <div className="w-56 border-r border-border bg-card/50 p-3 overflow-y-auto shrink-0">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Timeline</h3>
          <div className="space-y-1">
            {STEPS.map((s, i) => {
              const status = simStatuses[i];
              const isActive = i === activeStep;
              return (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-full text-left rounded px-2.5 py-2 transition-colors ${
                    isActive ? 'bg-accent border border-primary/30' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      status === 'completed' ? 'bg-status-ok/20 text-status-ok'
                      : status === 'active' ? 'bg-primary/20 text-primary'
                      : 'bg-accent text-muted-foreground'
                    }`}>
                      {status === 'completed' ? '✓' : i + 1}
                    </div>
                    <div>
                      <p className={`text-[11px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{s.day}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{s.title}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Flow summary */}
          <div className="mt-4 pt-3 border-t border-border">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Integrations</h4>
            <div className="space-y-1.5 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><Send className="h-3 w-3" /> WhatsApp Business API</div>
              <div className="flex items-center gap-1.5"><BarChart3 className="h-3 w-3" /> Odoo CRM</div>
              <div className="flex items-center gap-1.5"><Wifi className="h-3 w-3" /> NOC Atlas (Zabbix)</div>
              <div className="flex items-center gap-1.5"><MessageCircle className="h-3 w-3" /> Claude (Anthropic)</div>
              <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> n8n Scheduler</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat preview */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                {step.icon}
              </div>
              <div>
                <h2 className="text-xs font-semibold">{step.day} — {step.title}</h2>
                <p className="text-[10px] text-muted-foreground">Canal: {step.channel}</p>
              </div>
            </div>

            {/* WhatsApp-style chat */}
            <div className="flex-1 bg-accent/30 rounded border border-border p-3 overflow-y-auto space-y-1">
              {/* Phone header mock */}
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border">
                <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center">
                  <MessageCircle className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">Coco Bot</p>
                  <p className="text-[9px] text-status-ok">en línea</p>
                </div>
              </div>

              {simStatuses[activeStep] !== 'pending' ? (
                step.messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                  <Clock className="h-4 w-4 mr-2" /> Pendiente — simula para activar
                </div>
              )}
            </div>
          </div>

          {/* Actions panel */}
          <div className="w-52 border-l border-border bg-card/50 p-3 overflow-y-auto shrink-0">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Acciones n8n</h3>
            <div className="space-y-1.5">
              {step.actions?.map((action, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                  <ChevronRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  <span>{action}</span>
                </div>
              ))}
            </div>

            {/* Tech stack per step */}
            <div className="mt-4 pt-3 border-t border-border">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Nodos activos</h4>
              <div className="space-y-1">
                {activeStep === 0 && (
                  <>
                    <NodePill label="Webhook Odoo" />
                    <NodePill label="Claude — Bienvenida" />
                    <NodePill label="WhatsApp API" />
                  </>
                )}
                {activeStep === 1 && (
                  <>
                    <NodePill label="n8n Scheduler" />
                    <NodePill label="WhatsApp API" />
                    <NodePill label="Enviar PDF" />
                  </>
                )}
                {activeStep === 2 && (
                  <>
                    <NodePill label="NOC Verificación" />
                    <NodePill label="IF: ¿Online?" />
                    <NodePill label="WhatsApp API" />
                    <NodePill label="Escalar técnico" />
                  </>
                )}
                {activeStep === 3 && (
                  <>
                    <NodePill label="Odoo: Ventas" />
                    <NodePill label="IF: ¿Vendió?" />
                    <NodePill label="Claude — Tips" />
                    <NodePill label="WhatsApp API" />
                  </>
                )}
                {activeStep === 4 && (
                  <>
                    <NodePill label="Claude — Reporte" />
                    <NodePill label="Odoo: Métricas" />
                    <NodePill label="NOC: Datos uso" />
                    <NodePill label="WhatsApp API" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NodePill({ label }: { label: string }) {
  return (
    <div className="bg-accent rounded px-2 py-1 text-[10px] font-mono text-muted-foreground border border-border">
      {label}
    </div>
  );
}
