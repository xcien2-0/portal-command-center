import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, ChevronRight, Check, X, Search, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── NOC dark tokens ── */
const dk = {
  bg: '#0f1923',
  surface: '#1a2733',
  border: '#2a3f50',
  text: '#F5F5F7',
  textSec: '#8ba3b8',
  teal: '#12B886',
  red: '#FF3B30',
  blue: '#007AFF',
  amber: '#FF9500',
};

/* ── Mock data ── */
interface Equipment {
  type: string;
  name: string;
  serial: string;
  status: 'bodega' | 'cliente' | 'dañado';
  location: string;
  purchaseDate: string;
  technician: string;
}

interface Client {
  id: string;
  company: string;
  address: string;
  plan: string;
}

const mockEquipment: Equipment = {
  type: 'ROUTER CPE',
  name: 'Router CPE FWA Tarana B5',
  serial: 'XCI-RTR-2024-0847',
  status: 'bodega',
  location: 'Bodega Central Monterrey',
  purchaseDate: '15 ago 2024',
  technician: 'Sin asignar',
};

const mockClients: Client[] = [
  { id: '1', company: 'Manufactura del Norte S.A.', address: 'Av. Industrial 234, Monterrey', plan: 'Empresarial 500' },
  { id: '2', company: 'Grupo Logístico Alfa', address: 'Blvd. Rogelio Cantú 1200, San Pedro', plan: 'Dedicado 1G' },
  { id: '3', company: 'Hotel Santa Lucía', address: 'Morelos 456, Centro, Monterrey', plan: 'Hotelero Pro' },
  { id: '4', company: 'Clínica San José', address: 'Constitución 789, Monterrey', plan: 'Salud 200' },
  { id: '5', company: 'Colegio Bilingüe Vanguardia', address: 'Sierra Madre 1500, San Nicolás', plan: 'Educación 300' },
];

type PageState = 'scanning' | 'found' | 'client-select' | 'damage' | 'success';
type DamageType = 'tecnica' | 'liquidos' | 'electrico' | 'fisico' | 'desconocida' | null;

const damageOptions: { key: DamageType; icon: string; label: string }[] = [
  { key: 'tecnica', icon: '🔴', label: 'Falla técnica' },
  { key: 'liquidos', icon: '💧', label: 'Daño por líquidos' },
  { key: 'electrico', icon: '⚡', label: 'Daño eléctrico' },
  { key: 'fisico', icon: '🔨', label: 'Daño físico' },
  { key: 'desconocida', icon: '❓', label: 'Causa desconocida' },
];

export default function Scan() {
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('scanning');
  const [equipment] = useState<Equipment>(mockEquipment);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [damageType, setDamageType] = useState<DamageType>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [damageNotes, setDamageNotes] = useState('');

  // Simulate scan after 3s
  useEffect(() => {
    if (state !== 'scanning') return;
    const t = setTimeout(() => setState('found'), 3000);
    return () => clearTimeout(t);
  }, [state]);

  // Auto-return after success
  useEffect(() => {
    if (state !== 'success') return;
    const t = setTimeout(() => {
      setState('scanning');
      setSelectedClient(null);
      setShowConfirm(false);
      setDamageType(null);
      setHasPhoto(false);
      setDamageNotes('');
    }, 2000);
    return () => clearTimeout(t);
  }, [state]);

  const filteredClients = mockClients.filter(c =>
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirmInstall = useCallback(() => {
    setShowConfirm(false);
    setState('success');
  }, []);

  const handleReportDamage = useCallback(() => {
    setState('success');
  }, []);

  const statusConfig = {
    bodega: { label: 'En bodega', color: dk.teal },
    cliente: { label: 'En cliente', color: dk.blue },
    dañado: { label: 'Dañado', color: dk.red },
  };

  /* ── SUCCESS STATE ── */
  if (state === 'success') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: dk.teal }}>
        <div className="animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
        </div>
        <p className="text-white text-xl font-bold">✓ Instalado correctamente</p>
        <p className="text-white/70 text-sm mt-2">Odoo y Supabase actualizados</p>
      </div>
    );
  }

  /* ── DAMAGE REPORT STATE ── */
  if (state === 'damage') {
    return (
      <div className="fixed inset-0 flex flex-col overflow-auto" style={{ background: dk.bg, color: dk.text }}>
        {/* Top bar */}
        <div className="flex items-center h-14 px-4 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
          <button onClick={() => setState('found')} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <span className="flex-1 text-center text-sm font-medium">Reportar daño</span>
          <div className="w-6" />
        </div>

        <div className="flex-1 p-4 space-y-5 overflow-auto pb-28">
          {/* Damage types */}
          <div className="space-y-2">
            {damageOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setDamageType(opt.key)}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all"
                style={{
                  background: dk.surface,
                  border: `2px solid ${damageType === opt.key ? dk.teal : dk.border}`,
                  color: damageType === opt.key ? dk.teal : dk.text,
                  minHeight: 72,
                }}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-[15px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Photo */}
          <div>
            <button
              onClick={() => setHasPhoto(true)}
              className="w-full flex flex-col items-center justify-center rounded-xl transition-all"
              style={{
                height: 180,
                border: `2px dashed ${hasPhoto ? dk.teal : dk.border}`,
                background: hasPhoto ? `${dk.teal}10` : dk.surface,
                color: hasPhoto ? dk.teal : dk.textSec,
              }}
            >
              {hasPhoto ? (
                <>
                  <Check className="w-8 h-8 mb-2" />
                  <span className="text-sm">Foto capturada</span>
                </>
              ) : (
                <>
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm">Tomar foto</span>
                </>
              )}
            </button>
          </div>

          {/* Notes */}
          <textarea
            value={damageNotes}
            onChange={e => setDamageNotes(e.target.value)}
            rows={4}
            placeholder="Descripción adicional (opcional)"
            className="w-full rounded-xl p-4 text-sm resize-none outline-none"
            style={{
              background: dk.surface,
              border: `1px solid ${dk.border}`,
              color: dk.text,
            }}
          />
        </div>

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-6" style={{ background: dk.bg }}>
          <button
            onClick={handleReportDamage}
            disabled={!damageType}
            className="w-full rounded-xl text-white font-semibold text-[15px] transition-opacity disabled:opacity-40"
            style={{ background: dk.red, height: 56 }}
          >
            Reportar y dar de baja
          </button>
        </div>
      </div>
    );
  }

  /* ── CLIENT SELECTOR STATE ── */
  if (state === 'client-select') {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ background: dk.bg, color: dk.text }}>
        {/* Top bar */}
        <div className="flex items-center h-14 px-4 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
          <button onClick={() => setState('found')} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <span className="flex-1 text-center text-sm font-medium">Seleccionar cliente</span>
          <div className="w-6" />
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2 rounded-xl px-4" style={{ background: dk.surface, border: `1px solid ${dk.border}`, height: 52 }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: dk.textSec }} />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="flex-1 bg-transparent outline-none text-[15px]"
              style={{ color: dk.text }}
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto">
          {filteredClients.map(client => (
            <button
              key={client.id}
              onClick={() => { setSelectedClient(client); setShowConfirm(true); }}
              className="w-full flex items-center gap-3 px-4 transition-colors"
              style={{ height: 72, borderBottom: `1px solid ${dk.border}` }}
            >
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold" style={{ color: dk.text }}>{client.company}</p>
                <p className="text-[13px]" style={{ color: dk.textSec }}>{client.address}</p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: dk.surface, border: `1px solid ${dk.border}`, color: dk.textSec }}>
                {client.plan}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: dk.teal }} />
            </button>
          ))}
        </div>

        {/* Confirmation overlay */}
        {showConfirm && selectedClient && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowConfirm(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] p-6 pb-8 animate-slide-in-bottom" style={{ background: dk.surface }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: dk.border }} />
              <p className="text-lg font-semibold mb-4" style={{ color: dk.text }}>¿Confirmar instalación?</p>
              <div className="space-y-2 mb-6">
                <p className="text-sm" style={{ color: dk.textSec }}>Producto: <span className="font-semibold" style={{ color: dk.text }}>{equipment.name}</span></p>
                <p className="text-sm" style={{ color: dk.textSec }}>Cliente: <span className="font-semibold" style={{ color: dk.text }}>{selectedClient.company}</span></p>
              </div>
              <button onClick={handleConfirmInstall} className="w-full rounded-xl text-white font-semibold text-[15px]" style={{ background: dk.teal, height: 56 }}>
                Confirmar
              </button>
              <button onClick={() => setShowConfirm(false)} className="w-full mt-2 rounded-xl font-medium text-[15px]" style={{ color: dk.textSec, height: 48 }}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ── SCANNING + FOUND STATES ── */
  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: dk.bg }}>
      {/* Camera feed simulation */}
      <div className="flex-1 relative overflow-hidden">
        {/* Simulated camera bg */}
        <div className="absolute inset-0" style={{
          background: `radial-gradient(circle at center, ${dk.surface} 0%, ${dk.bg} 100%)`,
        }} />

        {/* Vignette overlay */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }} />

        {/* Top bar (transparent) */}
        <div className="absolute top-0 left-0 right-0 flex items-center h-14 px-4 z-10">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" style={{ color: dk.text }} />
          </button>
          <span className="flex-1 text-center text-sm font-medium" style={{ color: dk.text }}>ISPilot Scan</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: dk.teal, color: '#fff' }}>
            CM
          </div>
        </div>

        {/* Scanning frame (only in scanning state) */}
        {state === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative animate-scan-pulse" style={{ width: 220, height: 220 }}>
              {/* 4 corner brackets */}
              {/* Top-left */}
              <div className="absolute top-0 left-0" style={{ width: 24, height: 3, background: dk.teal }} />
              <div className="absolute top-0 left-0" style={{ width: 3, height: 24, background: dk.teal }} />
              {/* Top-right */}
              <div className="absolute top-0 right-0" style={{ width: 24, height: 3, background: dk.teal }} />
              <div className="absolute top-0 right-0" style={{ width: 3, height: 24, background: dk.teal }} />
              {/* Bottom-left */}
              <div className="absolute bottom-0 left-0" style={{ width: 24, height: 3, background: dk.teal }} />
              <div className="absolute bottom-0 left-0" style={{ width: 3, height: 24, background: dk.teal }} />
              {/* Bottom-right */}
              <div className="absolute bottom-0 right-0" style={{ width: 24, height: 3, background: dk.teal }} />
              <div className="absolute bottom-0 right-0" style={{ width: 3, height: 24, background: dk.teal }} />

              {/* Scan line */}
              <div className="absolute left-3 right-3 h-[2px] animate-scan-line" style={{ background: `${dk.teal}60` }} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div
        className="shrink-0 rounded-t-[20px] transition-all duration-300 ease-out overflow-auto"
        style={{
          background: dk.surface,
          maxHeight: state === 'found' ? '80vh' : 120,
          minHeight: state === 'found' ? '60vh' : 120,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: dk.border }} />
        </div>

        {state === 'scanning' ? (
          <div className="px-6 pb-6 text-center">
            <p className="text-[15px] mb-2" style={{ color: dk.textSec }}>Apunta al código QR del equipo</p>
            <button className="text-sm font-medium" style={{ color: dk.teal }}>Ingresar serial manualmente</button>
          </div>
        ) : (
          /* EQUIPMENT FOUND */
          <div className="px-5 pb-8">
            {/* Type & name */}
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: dk.textSec }}>{equipment.type}</p>
            <p className="text-[22px] font-bold mb-1" style={{ color: dk.text }}>{equipment.name}</p>
            <p className="font-mono text-sm mb-4" style={{ color: dk.textSec }}>{equipment.serial}</p>

            {/* Status chip */}
            <div className="flex justify-center mb-5">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
                style={{
                  background: `${statusConfig[equipment.status].color}15`,
                  border: `1.5px solid ${statusConfig[equipment.status].color}40`,
                  color: statusConfig[equipment.status].color,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: statusConfig[equipment.status].color }} />
                {statusConfig[equipment.status].label}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px mb-4" style={{ background: dk.border }} />

            {/* Detail rows */}
            <div className="space-y-3 mb-5">
              {[
                ['Ubicación', equipment.location],
                ['Compra', equipment.purchaseDate],
                ['Técnico', equipment.technician],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: dk.textSec }}>{label}</span>
                  <span className="text-sm font-medium" style={{ color: dk.text }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px mb-5" style={{ background: dk.border }} />

            {/* Action buttons */}
            {equipment.status === 'bodega' && (
              <div className="space-y-2">
                <button
                  onClick={() => setState('client-select')}
                  className="w-full rounded-xl text-white font-semibold text-[15px]"
                  style={{ background: dk.bg, height: 56 }}
                >
                  Instalar en cliente
                </button>
                <button
                  className="w-full rounded-xl font-semibold text-[15px]"
                  style={{ border: `1.5px solid ${dk.border}`, color: dk.text, height: 56 }}
                >
                  Asignar a mi kit
                </button>
                <button
                  onClick={() => setState('damage')}
                  className="w-full rounded-xl font-medium text-[15px]"
                  style={{ color: dk.red, height: 56 }}
                >
                  Reportar daño
                </button>
              </div>
            )}

            <button
              onClick={() => setState('scanning')}
              className="w-full mt-3 text-sm font-medium"
              style={{ color: dk.textSec, height: 44 }}
            >
              Escanear otro equipo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
