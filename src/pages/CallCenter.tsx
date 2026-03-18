import { useState, useRef, useEffect } from 'react';
import { Phone, User, Store, Send, Bot, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type CallerType = 'end_user' | 'affiliate' | null;
type MsgRole = 'user' | 'agent' | 'system';

interface ChatMsg {
  role: MsgRole;
  text: string;
}

// Decision-tree resolution engine
interface Resolution {
  keyword: string[];
  steps: string[];
  escalate?: boolean;
}

const RESOLUTIONS: Resolution[] = [
  {
    keyword: ['no tengo internet', 'no me conecta', 'no conecta', 'sin internet', 'no jala'],
    steps: [
      '¿Ves la red WiFi "Coco-[comunidad]" en tu celular?\n\n• Si NO la ves → "La Coco Box puede estar sin luz. Avísale al afiliado de tu comunidad."\n• Si SÍ la ves → seguimos al paso 2.',
      '¿Tu plan está vigente? Checa en internetcoco.com con tu número.\n\n• Si está vencido → te mando link de pago.\n• Si está vigente → paso 3.',
      'Olvida la red WiFi y vuelve a conectarte.\n\nSi sigue sin funcionar, voy a crear un ticket para que un técnico te ayude. 🔧',
    ],
  },
  {
    keyword: ['recargar', 'se acabó', 'plan', 'pagar', 'recarga', 'comprar plan', 'renovar'],
    steps: [
      'Claro, estos son los planes disponibles:\n\n• 1 hora — $15 MXN\n• 1 día — $35 MXN\n• 7 días — $50 MXN\n• 30 días — $110 MXN\n\n¿Cuál te gustaría?',
      'Perfecto. Te envío el link de pago directo 💳\n\n→ pago.internetcoco.com/recarga\n\nEn cuanto se confirme tu pago, tu plan se activa automáticamente. ✅',
    ],
  },
  {
    keyword: ['lento', 'muy lento', 'tarda', 'no carga', 'se traba'],
    steps: [
      'Déjame revisar tu Coco Box...\n\n📊 Verificando usuarios conectados y estado de señal en el NOC.',
      'Tu Coco Box tiene bastantes usuarios conectados ahorita.\n\nEl servicio mejora después de las 9pm cuando hay menos gente.\n\nSi sigue lento mañana, creo un ticket técnico. 🔧',
    ],
  },
  {
    keyword: ['comisión', 'comisiones', 'mis ventas', 'cuánto me deben', 'balance'],
    steps: [
      '📊 Consultando tu balance en Odoo...\n\nTu comisión acumulada este mes: $2,450 MXN\n• Ventas cerradas: 22\n• Próximo pago: Viernes 15\n\n¿Necesitas algo más?',
    ],
  },
  {
    keyword: ['activar', 'activación', 'código', 'pendiente'],
    steps: [
      '🔍 Revisando activaciones pendientes...\n\n• 3 activaciones pendientes de confirmación NOC\n• 1 activación completada hoy\n\nLas pendientes se procesan cada 2 horas. ¿Te ayudo con algo más?',
    ],
  },
  {
    keyword: ['inventario', 'planes disponibles', 'cuántos planes'],
    steps: [
      '📦 Tu inventario actual de planes:\n\n• Básico (5 Mbps): 45 disponibles\n• Familiar (10 Mbps): 30 disponibles\n• Premium (20 Mbps): 12 disponibles\n\n¿Quieres hacer un pedido?',
    ],
  },
  {
    keyword: ['nahuatl', 'mixtec', 'zapotec', 'lengua', 'no hablo español', 'no entiendo'],
    steps: [
      'Voy a conectarte con alguien que habla tu idioma. 🤝\n\n🔄 Escalando a agente bilingüe...',
    ],
    escalate: true,
  },
];

const GREETING_USER = '¡Hola! 👋 Soy Coco Asistente.\n\nEstoy aquí para ayudarte con tu internet.\n\n¿En qué te puedo ayudar?';
const GREETING_AFFILIATE = '¡Hola, afiliado! 👋\n\nSoy Coco Asistente, tu soporte operativo.\n\nPuedo ayudarte con:\n• Balance de comisiones\n• Activaciones pendientes\n• Inventario de planes\n• Registro de nuevo afiliado\n\n¿Qué necesitas?';

function findResolution(text: string): Resolution | null {
  const lower = text.toLowerCase();
  return RESOLUTIONS.find(r => r.keyword.some(k => lower.includes(k))) ?? null;
}

export default function CallCenter() {
  const [callerType, setCallerType] = useState<CallerType>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [currentResolution, setCurrentResolution] = useState<Resolution | null>(null);
  const [resolutionStep, setResolutionStep] = useState(0);
  const [escalated, setEscalated] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectCallerType = (type: CallerType) => {
    setCallerType(type);
    const greeting = type === 'end_user' ? GREETING_USER : GREETING_AFFILIATE;
    setMessages([{ role: 'agent', text: greeting }]);
  };

  const reset = () => {
    setCallerType(null);
    setMessages([]);
    setInput('');
    setCurrentResolution(null);
    setResolutionStep(0);
    setEscalated(false);
  };

  const handleSend = () => {
    if (!input.trim() || escalated) return;
    const userMsg = input.trim();
    setInput('');

    const newMessages: ChatMsg[] = [...messages, { role: 'user', text: userMsg }];

    // If we're mid-resolution, advance to next step
    if (currentResolution && resolutionStep < currentResolution.steps.length) {
      const nextStep = resolutionStep;
      const agentReply = currentResolution.steps[nextStep];
      newMessages.push({ role: 'agent', text: agentReply });

      if (currentResolution.escalate) {
        newMessages.push({ role: 'system', text: '🔴 Escalado a agente humano' });
        setEscalated(true);
      }

      setResolutionStep(nextStep + 1);
      if (nextStep + 1 >= currentResolution.steps.length && !currentResolution.escalate) {
        newMessages.push({ role: 'agent', text: '¿Te puedo ayudar con algo más? 😊' });
        setCurrentResolution(null);
        setResolutionStep(0);
      }
      setMessages(newMessages);
      return;
    }

    // Try to match a new resolution
    const resolution = findResolution(userMsg);
    if (resolution) {
      setCurrentResolution(resolution);
      const firstStep = resolution.steps[0];
      newMessages.push({ role: 'agent', text: firstStep });

      if (resolution.escalate) {
        newMessages.push({ role: 'system', text: '🔴 Escalado a agente humano' });
        setEscalated(true);
      }

      setResolutionStep(1);
      if (resolution.steps.length === 1 && !resolution.escalate) {
        newMessages.push({ role: 'agent', text: '¿Te puedo ayudar con algo más? 😊' });
        setCurrentResolution(null);
        setResolutionStep(0);
      }
    } else {
      newMessages.push({
        role: 'agent',
        text: 'Entiendo. Déjame revisar eso para ti.\n\nSi tu problema es urgente, puedo conectarte con un agente humano. ¿Quieres que lo haga?',
      });
    }

    setMessages(newMessages);
  };

  // Caller type selection
  if (!callerType) {
    return (
      <div className="flex flex-col h-[calc(100vh-2.5rem)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <div>
            <h1 className="text-sm font-semibold">Call Center — Coco Asistente</h1>
            <p className="text-[10px] text-muted-foreground">Agente automatizado · WhatsApp + Claude · Tenant: coco</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Phone className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-base font-semibold">Nueva llamada entrante</h2>
              <p className="text-xs text-muted-foreground mt-1">Selecciona el tipo de usuario para iniciar la simulación</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => selectCallerType('end_user')}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <User className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <h3 className="text-xs font-semibold mb-0.5">Usuario Final</h3>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Residente de comunidad. Problemas de conexión, recargas, contraseñas.
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">Español simple</Badge>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">Máx 3 pasos</Badge>
                </div>
              </button>

              <button
                onClick={() => selectCallerType('affiliate')}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Store className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <h3 className="text-xs font-semibold mb-0.5">Afiliado</h3>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Revendedor local. Comisiones, activaciones, inventario de planes.
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">Profesional</Badge>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">Odoo + NOC</Badge>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-semibold">Call Center — Coco Asistente</h1>
            <p className="text-[10px] text-muted-foreground">Simulación activa · {callerType === 'end_user' ? 'Usuario Final' : 'Afiliado'}</p>
          </div>
          <Badge className={`text-[9px] h-4 px-1.5 ${callerType === 'end_user' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-status-warning/20 text-status-warning border-status-warning/30'}`}>
            {callerType === 'end_user' ? 'Tipo A — Usuario' : 'Tipo B — Afiliado'}
          </Badge>
          {escalated && (
            <Badge className="text-[9px] h-4 px-1.5 bg-destructive/20 text-destructive border-destructive/30 animate-pulse-alert">
              Escalado
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={reset}>
          <RotateCcw className="h-3 w-3 mr-1" /> Nueva llamada
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card/50">
            {escalated ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center py-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Llamada escalada a agente humano
              </div>
            ) : (
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={callerType === 'end_user' ? 'Ej: "No tengo internet", "Quiero recargar"...' : 'Ej: "Mis comisiones", "Activaciones pendientes"...'}
                  className="min-h-[36px] max-h-[72px] text-xs resize-none"
                  rows={1}
                />
                <Button size="sm" className="h-9 px-3 shrink-0" onClick={handleSend} disabled={!input.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — Resolution guide */}
        <div className="w-60 border-l border-border bg-card/50 p-3 overflow-y-auto shrink-0">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Guía de resolución
          </h3>

          {callerType === 'end_user' ? (
            <div className="space-y-3">
              <IssueCard
                title="Sin internet"
                triggers={['no tengo internet', 'no me conecta']}
                steps={['Verificar red WiFi visible', 'Validar plan vigente', 'Reconectar / ticket']}
              />
              <IssueCard
                title="Recargar plan"
                triggers={['recargar', 'se acabó mi plan']}
                steps={['Mostrar planes', 'Enviar link de pago']}
              />
              <IssueCard
                title="Internet lento"
                triggers={['lento', 'no carga']}
                steps={['Check NOC carga', 'Recomendar horario']}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <IssueCard
                title="Comisiones"
                triggers={['comisión', 'balance']}
                steps={['Query Odoo balance']}
              />
              <IssueCard
                title="Activaciones"
                triggers={['activar', 'pendiente']}
                steps={['Query Supabase status']}
              />
              <IssueCard
                title="Inventario"
                triggers={['inventario', 'planes']}
                steps={['Query Odoo stock']}
              />
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-border">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Escalación</h4>
            <div className="space-y-1.5 text-[10px] text-muted-foreground">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <span>Lengua indígena detectada</span>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <span>3+ intentos fallidos</span>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <span>Disputa de cobro &gt;$500</span>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <span>Comunidad offline (P1)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Integraciones</h4>
            <div className="space-y-1.5 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><Bot className="h-3 w-3" /> Claude (Anthropic)</div>
              <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> WhatsApp Business</div>
              <div className="flex items-center gap-1.5"><Store className="h-3 w-3" /> Odoo CRM</div>
              <div className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3" /> NOC Atlas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMsg }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center my-1.5">
        <span className="text-[10px] bg-destructive/10 text-destructive px-2.5 py-1 rounded-full border border-destructive/20">{msg.text}</span>
      </div>
    );
  }
  const isAgent = msg.role === 'agent';
  return (
    <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} my-1`}>
      <div
        className={`rounded-lg px-3 py-2 text-[11px] whitespace-pre-line max-w-[80%] ${
          isAgent
            ? 'bg-primary/15 border border-primary/20 text-foreground'
            : 'bg-accent border border-border text-foreground'
        }`}
      >
        {isAgent && <p className="text-[9px] text-primary font-semibold mb-0.5">🤖 Coco Asistente</p>}
        {!isAgent && <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">👤 Llamada entrante</p>}
        {msg.text}
      </div>
    </div>
  );
}

function IssueCard({ title, triggers, steps }: { title: string; triggers: string[]; steps: string[] }) {
  return (
    <div className="bg-accent/50 rounded border border-border p-2">
      <p className="text-[11px] font-semibold mb-1">{title}</p>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {triggers.map((t, i) => (
          <span key={i} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{t}</span>
        ))}
      </div>
      <div className="space-y-0.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-1 text-[9px] text-muted-foreground">
            <span className="text-primary font-bold shrink-0">{i + 1}.</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
