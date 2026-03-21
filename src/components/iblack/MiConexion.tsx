import { useState } from 'react';
import { ArrowUp, Wifi, Smartphone, Laptop, Tv, Tablet, Speaker, HardDrive, ChevronRight, AlertCircle, CalendarDays, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IBLACK_MESH_NODES, IBLACK_DEVICES, type IBlackDevice } from '@/data/mockIBlackData';

const deviceIcons: Record<IBlackDevice['icon'], React.ElementType> = {
  phone: Smartphone,
  laptop: Laptop,
  tv: Tv,
  tablet: Tablet,
  speaker: Speaker,
  other: HardDrive,
};

function SignalCircle({ quality, dbm }: { quality: string; dbm: number }) {
  const color = quality === 'excellent' ? '#22C55E' : quality === 'good' ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}18`, border: `2px solid ${color}` }}
      >
        <Wifi className="h-5 w-5" style={{ color }} />
      </div>
      <span className="text-[13px] font-mono text-[#6E6E73]">{dbm} dBm</span>
    </div>
  );
}

export default function IBlackMiConexion() {
  const [showAllDevices, setShowAllDevices] = useState(false);
  const visibleDevices = showAllDevices ? IBLACK_DEVICES : IBLACK_DEVICES.slice(0, 4);

  return (
    <div className="max-w-[960px] mx-auto px-8 py-10">
      {/* Hero */}
      <section className="flex items-start justify-between gap-8">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#86868B] mb-2">
            Velocidad en este momento
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[64px] font-bold leading-none tracking-tight text-[#1D1D1F]">987</span>
            <span className="text-[24px] text-[#86868B] font-medium">Mbps</span>
          </div>
          <p className="mt-2 text-[15px] text-[#6E6E73] flex items-center gap-1.5">
            <ArrowUp className="h-4 w-4 text-[#22C55E]" />
            991 Mbps subida
          </p>
          <p className="mt-1 text-[13px] text-[#86868B]">
            Hace 4 minutos · <button className="text-[#0a0a0a] underline underline-offset-2 hover:no-underline">Probar ahora</button>
          </p>
        </div>

        <div className="text-right space-y-2 pt-1">
          <Badge className="bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20 text-[13px] px-3 py-1 hover:bg-[#22C55E]/10">
            <span className="inline-block w-2 h-2 rounded-full bg-[#22C55E] mr-2" />
            Servicio activo
          </Badge>
          <p className="text-[15px] text-[#1D1D1F] font-medium">iBlack Giga — 1 Gbps simétrico</p>
          <p className="text-[28px] font-bold text-[#22C55E]">100.0%</p>
          <p className="text-[12px] text-[#86868B]">Uptime este mes</p>
          <p className="text-[13px] text-[#6E6E73] mt-1">
            Próxima visita preventiva: <span className="font-semibold text-[#1D1D1F]">28 de marzo</span>
          </p>
        </div>
      </section>

      <div className="border-t border-[#E5E5E7] mt-8 mb-10" />

      {/* WiFi Nodes */}
      <section>
        <h2 className="text-[20px] font-semibold text-[#1D1D1F] mb-5">Señal en tu hogar</h2>
        <div className="grid grid-cols-3 gap-4">
          {IBLACK_MESH_NODES.map(node => (
            <div
              key={node.id}
              className="bg-white border border-[#E5E5E7] rounded-2xl p-5 flex flex-col items-center text-center"
            >
              <p className="text-[17px] font-semibold text-[#1D1D1F] mb-4">{node.room}</p>
              <SignalCircle quality={node.quality} dbm={node.signalDbm} />
              <p className="mt-3 text-[13px] text-[#86868B]">
                {node.devices} dispositivos
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Devices */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-[20px] font-semibold text-[#1D1D1F]">Dispositivos conectados</h2>
          <Badge className="bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7] text-[13px] px-2 py-0.5 hover:bg-[#F5F5F7]">
            {IBLACK_DEVICES.length}
          </Badge>
        </div>
        <div className="bg-white border border-[#E5E5E7] rounded-2xl overflow-hidden">
          {visibleDevices.map((device, i) => {
            const Icon = deviceIcons[device.icon];
            return (
              <div
                key={device.id}
                className={`flex items-center px-5 py-3.5 ${i < visibleDevices.length - 1 ? 'border-b border-[#F5F5F7]' : ''}`}
              >
                <Icon className="h-[18px] w-[18px] text-[#86868B] mr-4" />
                <span className="flex-1 text-[14px] text-[#1D1D1F]">{device.name}</span>
                <span className="text-[13px] text-[#86868B] w-16 text-center">{device.band}</span>
                <span className="text-[13px] font-mono text-[#6E6E73] w-24 text-right">{device.usage} Mbps</span>
              </div>
            );
          })}
          {!showAllDevices && IBLACK_DEVICES.length > 4 && (
            <button
              onClick={() => setShowAllDevices(true)}
              className="w-full py-3 text-[13px] text-[#0a0a0a] font-medium hover:bg-[#F5F5F7] transition-colors flex items-center justify-center gap-1"
            >
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mt-10 flex gap-3">
        <Button className="flex-1 h-12 bg-[#1D1D1F] hover:bg-[#2D2D2F] text-white text-[14px] font-medium rounded-xl">
          <AlertCircle className="h-4 w-4 mr-2" />
          Reportar problema
        </Button>
        <Button variant="outline" className="flex-1 h-12 border-[#E5E5E7] text-[#1D1D1F] text-[14px] font-medium rounded-xl hover:bg-[#F5F5F7]">
          <CalendarDays className="h-4 w-4 mr-2" />
          Agendar visita técnica
        </Button>
        <Button variant="outline" className="flex-1 h-12 border-[#E5E5E7] text-[#1D1D1F] text-[14px] font-medium rounded-xl hover:bg-[#F5F5F7]">
          <History className="h-4 w-4 mr-2" />
          Ver historial
        </Button>
      </section>
    </div>
  );
}
