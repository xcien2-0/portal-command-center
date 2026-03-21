import { Activity, AlertTriangle, RefreshCw } from 'lucide-react';

interface HeaderStatusBarProps {
  healthPercent: number;
  activeAlertCount: number;
  lastUpdated: string;
  viewMode: 'operador' | 'gerencial';
  onViewModeChange: (mode: 'operador' | 'gerencial') => void;
}

export function HeaderStatusBar({ healthPercent, activeAlertCount, lastUpdated, viewMode, onViewModeChange }: HeaderStatusBarProps) {
  const statusColor = healthPercent >= 95 ? 'text-[#34C759]' : healthPercent >= 85 ? 'text-[#FF9F0A]' : 'text-[#FF3B30]';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#2a3f50] bg-[#0f1923]/90 backdrop-blur-xl px-5 py-3">
      {/* Left */}
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-[#F5F5F7]">Red en Vivo</h1>
        <span className="text-[12px] text-[#8ba3b8] font-mono">{lastUpdated}</span>
      </div>

      {/* Center */}
      <div className="flex items-center gap-2">
        <Activity className={`h-4 w-4 ${statusColor}`} />
        <span className={`text-[17px] font-bold ${statusColor}`}>
          Red operando al {healthPercent}%
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {activeAlertCount > 0 && (
          <div className="flex items-center gap-1.5 bg-[#FF3B30]/15 text-[#FF3B30] px-2.5 py-1 rounded-full text-[12px] font-semibold animate-pulse-alert">
            <AlertTriangle className="h-3.5 w-3.5" />
            {activeAlertCount}
          </div>
        )}

        <div className="flex rounded-lg overflow-hidden border border-[#2a3f50]">
          {(['operador', 'gerencial'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-[#F5F5F7] text-[#0f1923]'
                  : 'bg-transparent text-[#8ba3b8] hover:text-[#F5F5F7]'
              }`}
            >
              {mode === 'operador' ? 'Operador' : 'Gerencial'}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
