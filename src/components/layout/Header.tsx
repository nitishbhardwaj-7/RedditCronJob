'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Plus, Zap, AlertCircle } from 'lucide-react';
import { IntegrationStatus } from '@/types/api';

interface HeaderProps {
  onOpenAddMonitor?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddMonitor }) => {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    fetch('/api/integrations/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus(data.data);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium text-slate-300">Reddit Monitoring SaaS</h2>
        <span className="text-slate-700">|</span>
        {status?.isMockMode ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-amber-950/60 text-amber-400 border border-amber-800/60">
            <AlertCircle className="w-3.5 h-3.5" />
            Mock Provider Mode
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <Zap className="w-3.5 h-3.5" />
            Live Apify & Gemini AI
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onOpenAddMonitor && (
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={onOpenAddMonitor}>
            Add Monitor
          </Button>
        )}
      </div>
    </header>
  );
};
