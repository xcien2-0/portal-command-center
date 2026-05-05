import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!userId) {
      setStatus('error');
      return;
    }

    const activate = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/activate/${userId}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setUserData(data.user);
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (e) {
        setStatus('error');
      }
    };

    activate();
  }, [userId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00A859] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#808080] font-medium">Validando invitación...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-sans p-6">
        <div className="max-w-md w-full bg-[#151515] border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Enlace no válido</h1>
          <p className="text-[#808080] mb-8">Esta invitación ha expirado o no existe en nuestros registros.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-[#00A859] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-sans p-6">
      <div className="max-w-xl w-full bg-[#151515] border border-white/5 rounded-3xl p-10 relative overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A859] opacity-10 blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative z-10">
          <img src="/xcien.png" alt="XCIEN" className="h-10 mb-8" />
          
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
            ¡Bienvenido a <span className="text-[#00A859]">XCIEN 2.0</span>!
          </h1>
          
          <p className="text-[#808080] text-lg mb-8 leading-relaxed">
            Hola <span className="text-white font-bold">{userData?.name}</span>, tu acceso como <span className="text-white font-bold">{userData?.role}</span> en el área de <span className="text-white font-bold">{userData?.department}</span> ha sido activado exitosamente.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="text-[#808080] text-xs font-bold uppercase mb-1">Módulo asignado</div>
              <div className="text-white font-semibold">Planeación Estratégica</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="text-[#808080] text-xs font-bold uppercase mb-1">Nivel de Acceso</div>
              <div className="text-white font-semibold">Gerencial</div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/xcien2')}
            className="w-full bg-[#00A859] text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,168,89,0.3)] text-lg"
          >
            Entrar al Centro de Comando
          </button>
          
          <p className="mt-6 text-center text-[#555] text-xs font-medium">
            SISTEMA OPERATIVO XCIEN — MOTOR ANTIGRAVITY v2.6.4
          </p>
        </div>
      </div>
    </div>
  );
}
