'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface SyncStatusProps {
  linkedCount: number;
  lastSync: string | null;
  intervalHours: number;
}

export function SyncStatus({ linkedCount, lastSync, intervalHours }: SyncStatusProps) {
  const [timeUntilNext, setTimeUntilNext] = useState('');

  useEffect(() => {
    const update = () => {
      if (!lastSync) {
        setTimeUntilNext('Aguardando...');
        return;
      }
      const lastMs = new Date(lastSync).getTime();
      const nextMs = lastMs + intervalHours * 60 * 60 * 1000;
      const remaining = nextMs - Date.now();

      if (remaining <= 0) {
        setTimeUntilNext('Sincronizando...');
        return;
      }

      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setTimeUntilNext(h > 0 ? `${h}h ${m}min` : `${m}min`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [lastSync, intervalHours]);

  if (linkedCount === 0) return null;

  return (
    <div className="border-t border-[#1a2332] px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] text-[#6b7a8d]">
        <RefreshCw className="h-3 w-3 text-green-400" />
        <span>Sync: {linkedCount} processo(s)</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-[#4a5568] mt-1">
        <Clock className="h-3 w-3" />
        <span>Próxima: {timeUntilNext}</span>
      </div>
    </div>
  );
}
