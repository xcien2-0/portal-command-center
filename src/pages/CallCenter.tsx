import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Phone, Ticket, Bot, AlertTriangle, CheckCircle2, Clock, Send, User, Building2, ChevronRight, PanelRightOpen, PanelRightClose, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type Channel = 'whatsapp' | 'call' | 'ticket';
type Status = 'bot_active' | 'escalated' | 'in_progress' | 'resolved';
type SenderType = 'bot' | 'client' | 'agent';

interface Company {
  id: string;
  name: string;
  color: string | null;
}

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  odoo_client_id: string | null;
  company_id: string;
}

interface Agent {
  id: string;
  name: string;
  is_online: boolean;
}

interface Conversation {
  id: string;
  company_id: string;
  contact_id: string;
  channel: Channel;
  status: Status;
  assigned_agent_id: string | null;
  subject: string | null;
  created_at: string;
  updated_at: string;
  contacts?: Contact;
  companies?: Company;
  agents?: Agent | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_name: string | null;
  content: string;
  created_at: string;
}

const channelIcon = (ch: Channel) => {
  switch (ch) {
    case 'whatsapp': return <MessageSquare className="h-3.5 w-3.5" />;
    case 'call': return <Phone className="h-3.5 w-3.5" />;
    case 'ticket': return <Ticket className="h-3.5 w-3.5" />;
  }
};

const channelLabel = (ch: Channel) => {
  switch (ch) {
    case 'whatsapp': return 'WhatsApp';
    case 'call': return 'Llamada';
    case 'ticket': return 'Ticket';
  }
};

const statusConfig: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  escalated: { label: 'Escalada', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  in_progress: { label: 'En progreso', color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.25)' },
  bot_active: { label: 'Bot activo', color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)' },
  resolved: { label: 'Resuelto', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
};

const STATUS_FILTERS: { key: Status | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Todas', icon: null },
  { key: 'escalated', label: 'Escaladas', icon: <span className="text-red-400">🔴</span> },
  { key: 'in_progress', label: 'En progreso', icon: <span>🟡</span> },
  { key: 'bot_active', label: 'Bot', icon: <span>🤖</span> },
  { key: 'resolved', label: 'Resueltas', icon: <span>✅</span> },
];

interface Props {
  theme?: any;
  activeThemeId?: string;
}

export default function CallCenter({ theme, activeThemeId }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [replyText, setReplyText] = useState('');
  const [showClientInfo, setShowClientInfo] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    const load = async () => {
      const [cRes, aRes, convRes] = await Promise.all([
        supabase.from('companies').select('*'),
        supabase.from('agents').select('*'),
        supabase.from('conversations').select('*, contacts(*), companies(*), agents(*)').order('updated_at', { ascending: false }),
      ]);
      if (cRes.data) setCompanies(cRes.data);
      if (aRes.data) setAgents(aRes.data as Agent[]);
      if (convRes.data) setConversations(convRes.data as any);
    };
    load();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const convChannel = supabase
      .channel('conversations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        supabase.from('conversations').select('*, contacts(*), companies(*), agents(*)').order('updated_at', { ascending: false })
          .then(({ data }) => { if (data) setConversations(data as any); });
      })
      .subscribe();

    const msgChannel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(convChannel); supabase.removeChannel(msgChannel); };
  }, []);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    supabase.from('messages').select('*').eq('conversation_id', selectedId).order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
  }, [selectedId]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selected = conversations.find(c => c.id === selectedId);

  const filtered = conversations.filter(c => {
    if (companyFilter && c.company_id !== companyFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const handleSend = async () => {
    if (!replyText.trim() || !selectedId) return;
    const content = replyText.trim();
    setReplyText('');
    // Optimistic
    const optimistic: Message = {
      id: crypto.randomUUID(),
      conversation_id: selectedId,
      sender_type: 'agent',
      sender_name: 'Agente',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    await supabase.from('messages').insert({ conversation_id: selectedId, sender_type: 'agent' as any, sender_name: 'Agente', content });
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() } as any).eq('id', selectedId);
  };

  const handleTake = async () => {
    if (!selectedId) return;
    await supabase.from('conversations').update({ status: 'in_progress' as any, assigned_agent_id: agents[0]?.id } as any).eq('id', selectedId);
  };

  const handleResolve = async () => {
    if (!selectedId) return;
    await supabase.from('conversations').update({ status: 'resolved' as any } as any).eq('id', selectedId);
  };

  const handleIntegrationAction = async (platform: string, label: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, action: 'test_connection' })
      });
      const data = await res.json();
      alert(`Integración ${label}: ${data.message || data.status}`);
    } catch (e) {
      alert(`Error conectando con ${label}`);
    }
  };

  const contactConvCount = selectedId && selected?.contact_id
    ? conversations.filter(c => c.contact_id === selected.contact_id).length
    : 0;

  return (
    <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden relative" style={{ background: theme?.bg || '#0f1117', color: '#e2e8f0' }}>
      {activeThemeId === 'matrix' && MatrixBackground && <MatrixBackground />}
      
      {/* Left Panel */}
      <div className="flex flex-col border-r" style={{ width: '30%', minWidth: 320, borderColor: '#1e2535', background: '#161b27' }}>
        {/* Company tabs */}
        <div className="flex items-center gap-1 px-3 pt-3 pb-2 overflow-x-auto flex-shrink-0">
          <PillButton active={!companyFilter} onClick={() => setCompanyFilter(null)}>Todas</PillButton>
          {companies.map(c => (
            <PillButton key={c.id} active={companyFilter === c.id} onClick={() => setCompanyFilter(c.id)} accentColor={c.color || undefined}>
              {c.name}
            </PillButton>
          ))}
        </div>
        {/* Status filters */}
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto flex-shrink-0">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] whitespace-nowrap transition-colors"
              style={{
                background: statusFilter === f.key ? 'rgba(0,200,150,0.15)' : 'transparent',
                color: statusFilter === f.key ? '#00c896' : '#64748b',
                border: statusFilter === f.key ? '1px solid rgba(0,200,150,0.3)' : '1px solid transparent',
              }}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          <div className="px-2 pb-2 space-y-1">
            {filtered.map(conv => {
              const contact = conv.contacts;
              const company = conv.companies;
              const sc = statusConfig[conv.status];
              const isActive = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  onClick={() => { setSelectedId(conv.id); setShowClientInfo(false); }}
                  className="w-full text-left rounded-lg px-3 py-2.5 transition-colors"
                  style={{
                    background: isActive ? '#252d40' : '#1e2535',
                    borderLeft: isActive ? '3px solid #00c896' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = '#252d40'); }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = '#1e2535'); }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: '#64748b' }}>{channelIcon(conv.channel)}</span>
                    <span className="text-[13px] font-medium truncate flex-1" style={{ color: '#e2e8f0' }}>
                      {contact?.name || 'Desconocido'}
                    </span>
                    <span className="text-[10px]" style={{ color: '#64748b' }}>
                      {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: false, locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {company && (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: `${company.color}22`, color: company.color || '#64748b', border: `1px solid ${company.color}44` }}
                      >
                        {company.name}
                      </span>
                    )}
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                    >
                      {sc.label}
                    </span>
                    <span className="text-[10px] truncate flex-1" style={{ color: '#64748b' }}>
                      {conv.subject}
                    </span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[13px]" style={{ color: '#64748b' }}>
                No hay conversaciones
              </div>
            )}
          </div>
        </ScrollArea>
        {/* Integrations Area - Enhanced Visibility */}
        <div className="p-4 border-t mt-auto" style={{ 
          borderColor: 'rgba(0,255,136,0.3)', 
          background: 'rgba(0,20,40,0.6)',
          boxShadow: '0 -10px 20px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">🔌 CONECTORES EXTERNOS</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Sincronización Activa" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleIntegrationAction('net2phone', 'Net2Phone')}
              className="flex items-center justify-between p-2.5 rounded-lg border transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(0,255,136,0.1)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📞</span>
                <span className="text-[11px] font-bold text-white">Net2Phone</span>
              </div>
              <span className="text-[9px] text-emerald-400/70 font-mono">LINKED</span>
            </button>

            <button 
              onClick={() => handleIntegrationAction('hubspot', 'HubSpot')}
              className="flex items-center justify-between p-2.5 rounded-lg border transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,167,0,0.1)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🧡</span>
                <span className="text-[11px] font-bold text-white">HubSpot CRM</span>
              </div>
              <span className="text-[9px] text-orange-400/70 font-mono">LINKED</span>
            </button>

            <button 
              onClick={() => handleIntegrationAction('ai_agents', 'Agentes IA')}
              className="flex items-center justify-between p-2.5 rounded-lg border transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(167,139,250,0.1)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-[11px] font-bold text-white">Agentes IA</span>
              </div>
              <span className="text-[9px] text-purple-400/70 font-mono">READY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#0f1117' }}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: '#64748b' }}>
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecciona una conversación</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#1e2535', background: '#161b27' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#252d40', color: '#e2e8f0' }}>
                  {(selected.contacts?.name || 'D')[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{selected.contacts?.name}</span>
                    {selected.companies && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${selected.companies.color}22`, color: selected.companies.color || '#64748b' }}>
                        {selected.companies.name}
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: '#64748b' }}>{channelLabel(selected.channel)}</span>
                  </div>
                  <p className="text-[11px] truncate" style={{ color: '#64748b' }}>{selected.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selected.status === 'escalated' && !selected.assigned_agent_id && (
                  <Button size="sm" className="h-7 text-[11px] px-3" style={{ background: '#00c896', color: '#0f1117' }} onClick={handleTake}>
                    Tomar conversación
                  </Button>
                )}
                {selected.status !== 'resolved' && (
                  <Button size="sm" variant="outline" className="h-7 text-[11px] px-3" style={{ borderColor: '#2a3f50', color: '#e2e8f0' }} onClick={handleResolve}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Resolver
                  </Button>
                )}
                <button
                  onClick={() => setShowClientInfo(!showClientInfo)}
                  className="p-1.5 rounded hover:bg-white/5 transition-colors"
                  style={{ color: '#64748b' }}
                >
                  {showClientInfo ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Status banners */}
            {selected.status === 'bot_active' && (
              <div className="px-4 py-2 flex items-center gap-2 text-[11px]" style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8' }}>
                <Bot className="h-3.5 w-3.5" /> Siendo atendido por IA
              </div>
            )}
            {selected.status === 'escalated' && (
              <div className="px-4 py-2 flex items-center gap-2 text-[11px]" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
                <AlertTriangle className="h-3.5 w-3.5" /> Requiere atención humana
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              {/* Messages */}
              <div className="flex-1 flex flex-col min-w-0">
                <ScrollArea className="flex-1 px-4 py-3">
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {messages.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Reply input */}
                {(selected.status === 'in_progress' || selected.status === 'escalated') && (
                  <div className="p-3 border-t flex-shrink-0" style={{ borderColor: '#1e2535' }}>
                    <div className="flex gap-2 max-w-2xl mx-auto">
                      <Textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Escribe tu respuesta..."
                        className="min-h-[40px] max-h-[100px] text-[13px] resize-none border-0 focus-visible:ring-0"
                        style={{ background: '#1e2535', color: '#e2e8f0' }}
                        rows={1}
                      />
                      <Button size="sm" className="h-10 px-4 self-end" style={{ background: '#00c896', color: '#0f1117' }} onClick={handleSend} disabled={!replyText.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Client info panel */}
              {showClientInfo && selected.contacts && (
                <div className="w-72 border-l p-4 flex-shrink-0 overflow-y-auto" style={{ borderColor: '#1e2535', background: '#161b27' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Info del cliente</span>
                    <button onClick={() => setShowClientInfo(false)} className="p-1 rounded hover:bg-white/5" style={{ color: '#64748b' }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#252d40', color: '#e2e8f0' }}>
                        {selected.contacts.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{selected.contacts.name}</p>
                        {selected.companies && (
                          <span className="text-[10px]" style={{ color: selected.companies.color || '#64748b' }}>{selected.companies.name}</span>
                        )}
                      </div>
                    </div>
                    <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Teléfono" value={selected.contacts.phone || '—'} />
                    <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Email" value={selected.contacts.email || '—'} />
                    <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="ID Odoo" value={selected.contacts.odoo_client_id || '—'} />
                    <InfoRow icon={<MessageSquare className="h-3.5 w-3.5" />} label="Conversaciones" value={String(contactConvCount)} />
                    {selected.agents && (
                      <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Agente" value={selected.agents.name} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isClient = msg.sender_type === 'client';
  const isBot = msg.sender_type === 'bot';
  const isAgent = msg.sender_type === 'agent';

  let bubbleBg = '#1e2535'; // client
  let labelColor = '#64748b';
  let icon = '👤';
  if (isBot) { bubbleBg = '#1a2744'; icon = '🤖'; labelColor = '#64748b'; }
  if (isAgent) { bubbleBg = 'rgba(0,200,150,0.12)'; icon = '💬'; labelColor = '#00c896'; }

  return (
    <div className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
      <div className="rounded-lg px-3.5 py-2.5 max-w-[75%]" style={{ background: bubbleBg }}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px]">{icon}</span>
          <span className="text-[10px] font-semibold" style={{ color: labelColor }}>
            {msg.sender_name || (isBot ? 'Bot' : isAgent ? 'Agente' : 'Cliente')}
          </span>
          <span className="text-[9px]" style={{ color: '#475569' }}>
            {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: '#e2e8f0' }}>{msg.content}</p>
      </div>
    </div>
  );
}

function IntegrationBadge({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <div 
      title={active ? `Conectado a ${label}` : `Conectar ${label}`}
      onClick={onClick}
      className={`cursor-pointer flex flex-col items-center justify-center p-2 rounded border transition-colors ${active ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-700 bg-slate-800'}`}
    >
      <span className="text-lg mb-1">{icon}</span>
      <span className="text-[9px] font-medium text-slate-300">{label}</span>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: '#64748b' }} className="mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px]" style={{ color: '#64748b' }}>{label}</p>
        <p className="text-[12px] font-medium">{value}</p>
      </div>
    </div>
  );
}

function PillButton({ children, active, onClick, accentColor }: { children: React.ReactNode; active: boolean; onClick: () => void; accentColor?: string }) {
  const bg = active ? (accentColor ? `${accentColor}22` : 'rgba(0,200,150,0.15)') : 'transparent';
  const border = active ? (accentColor ? `${accentColor}44` : 'rgba(0,200,150,0.3)') : '#2a3f50';
  const color = active ? (accentColor || '#00c896') : '#64748b';

  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {children}
    </button>
  );
}
