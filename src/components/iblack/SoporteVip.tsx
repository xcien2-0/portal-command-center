import { useState, useRef, useEffect } from 'react';
import { Send, Phone, CalendarDays } from 'lucide-react';
import { IBLACK_CHAT_HISTORY, type IBlackChatMessage } from '@/data/mockIBlackData';

export default function IBlackSoporteVip() {
  const [messages, setMessages] = useState<IBlackChatMessage[]>(IBLACK_CHAT_HISTORY);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const clientMsg: IBlackChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'client',
      text: input.trim(),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, clientMsg]);
    setInput('');

    // Simulate agent response
    setTimeout(() => {
      const agentMsg: IBlackChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'agent',
        text: 'Entendido, déjame verificar eso para ti. Un momento por favor.',
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, agentMsg]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="pt-16 pb-6 text-center">
        <h1 className="text-[28px] font-semibold text-[#1D1D1F] tracking-tight">
          ¿En qué podemos ayudarte?
        </h1>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-8">
        <div className="max-w-[640px] mx-auto space-y-3 pb-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  msg.sender === 'client'
                    ? 'bg-[#1D1D1F] text-white rounded-br-md'
                    : 'bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-md'
                }`}
              >
                <p className="text-[14px] leading-relaxed">{msg.text}</p>
                <p className={`text-[11px] mt-1 ${msg.sender === 'client' ? 'text-white/50' : 'text-[#86868B]'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#E5E5E7] bg-white">
        <div className="max-w-[640px] mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 text-[14px] text-[#1D1D1F] placeholder:text-[#86868B] outline-none bg-transparent py-2"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-[#1D1D1F] flex items-center justify-center transition-opacity disabled:opacity-30 hover:bg-[#2D2D2F]"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-6 mt-2 pt-2 border-t border-[#F5F5F7]">
            <button className="flex items-center gap-1.5 text-[12px] text-[#86868B] hover:text-[#1D1D1F] transition-colors">
              <Phone className="h-3.5 w-3.5" />
              Prefiero hablar · +52 81 XXXX XXXX
            </button>
            <button className="flex items-center gap-1.5 text-[12px] text-[#86868B] hover:text-[#1D1D1F] transition-colors">
              <CalendarDays className="h-3.5 w-3.5" />
              Agendar visita · Hoy o mañana
            </button>
          </div>
        </div>

        {/* SLA */}
        <div className="text-center pb-3">
          <p className="text-[11px] text-[#C4C4C6] italic">
            Tiempo de respuesta garantizado: 30 segundos
          </p>
        </div>
      </div>
    </div>
  );
}
