import { useState } from 'react';
import { Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HeaderStatusBarProps {
  healthPercent: number;
  activeAlertCount: number;
  lastUpdated: string;
  viewMode: 'operador' | 'gerencial';
  onViewModeChange: (mode: 'operador' | 'gerencial') => void;
}

export function HeaderStatusBar({ healthPercent, activeAlertCount, lastUpdated, viewMode, onViewModeChange }: HeaderStatusBarProps) {
  const statusColor = healthPercent >= 98 ? 'text-status-ok' : healthPercent >= 90 ? 'text-status-warning' : 'text-status-critical';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur px-4 py-2">
      <div className="flex items-center gap-3">
        <Activity className={`h-5 w-5 ${statusColor}`} />
        <span className="text-sm font-semibold">
          Red Operando al <span className={`font-mono ${statusColor}`}>{healthPercent}%</span>
        </span>
        <Badge variant="destructive" className="animate-pulse-alert flex items-center gap-1 text-xs px-2 py-0.5">
          <AlertTriangle className="h-3 w-3" />
          {activeAlertCount}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          <span className="font-mono">{lastUpdated}</span>
        </div>

        <div className="flex rounded border border-border overflow-hidden">
          <button
            onClick={() => onViewModeChange('operador')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === 'operador' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
          >
            Operador
          </button>
          <button
            onClick={() => onViewModeChange('gerencial')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === 'gerencial' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
          >
            Gerencial
          </button>
        </div>
      </div>
    </header>
  );
}
