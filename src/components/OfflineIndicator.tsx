import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside aria-label="Mode Hors-Ligne" className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 text-white px-3.5 py-2.5 text-xs font-medium shadow-2xl border border-amber-500/40 backdrop-blur">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      </span>
      <div className="flex items-center gap-1.5">
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span>Mode Hors-Ligne</span>
      </div>
      <span className="text-slate-400 text-[11px] border-l border-slate-700 pl-2 flex items-center gap-1">
        <Database className="w-3 h-3 text-slate-400" />
        Données locales & révisions disponibles
      </span>
    </aside>
  );
};
