export function AdBanner() {
  return (
    <div className="bg-[#1A2B3C] border border-[#1E3A4A] rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#0D1B2A] rounded-lg flex items-center justify-center">
          <span className="text-[#64748b] text-[20px]">📡</span>
        </div>
        <div>
          <p className="text-[12px] text-[#e2e8f0] font-medium">Espacio publicitario — Vendors de red</p>
          <p className="text-[10px] text-[#64748b]">Patrocinado por Vendor Partner</p>
        </div>
      </div>
      <button className="px-3 py-1.5 rounded border border-[#00B4D8]/30 text-[#00B4D8] text-[11px] font-medium hover:bg-[#00B4D8]/10 transition-colors">
        Más info
      </button>
    </div>
  );
}
