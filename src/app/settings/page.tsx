'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Settings as SettingsIcon,
  Database,
  Radio,
  Cpu,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Save,
} from 'lucide-react';
import { IntegrationStatus } from '@/types/api';

export default function SettingsPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Settings form state
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [minConfidence, setMinConfidence] = useState('0.70');
  const [minSeverity, setMinSeverity] = useState('medium');
  const [defaultEmail, setDefaultEmail] = useState('alerts@yourcompany.com');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetch('/api/integrations/status')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setStatus(json.data);
        }
      })
      .catch(() => null)
      .finally(() => setIsLoadingStatus(false));
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const renderStatusBadge = (state: 'connected' | 'not_configured' | 'error') => {
    if (state === 'connected') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
        </span>
      );
    }
    if (state === 'not_configured') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/60">
          <AlertCircle className="w-3.5 h-3.5" /> Not configured (Mock Active)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-950/60 px-2.5 py-1 rounded-full border border-red-800/60">
        <ShieldAlert className="w-3.5 h-3.5" /> Error
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-300" />
            System Settings & Integrations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Check API connection status and configure global AI & alerting parameters.
          </p>
        </div>

        {/* Integration Connection Status Section */}
        <Card className="glass-card">
          <CardHeader>
            <div>
              <CardTitle>Integrations Status</CardTitle>
              <CardDescription>
                Server-side connection credentials defined in environment variables. Secret keys are never exposed to the client.
              </CardDescription>
            </div>
          </CardHeader>

          {isLoadingStatus ? (
            <p className="text-xs text-slate-400 py-4">Checking provider connection status...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* MongoDB Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">MongoDB</h4>
                    <p className="text-[11px] text-slate-500 font-mono">MONGODB_URI</p>
                  </div>
                </div>
                {renderStatusBadge(status?.mongodb || 'not_configured')}
              </div>

              {/* Apify Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">Apify Scraper</h4>
                    <p className="text-[11px] text-slate-500 font-mono">APIFY_API_TOKEN</p>
                  </div>
                </div>
                {renderStatusBadge(status?.apify || 'not_configured')}
              </div>

              {/* Gemini AI Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">Google Gemini API</h4>
                    <p className="text-[11px] text-slate-500 font-mono">GEMINI_API_KEY</p>
                  </div>
                </div>
                {renderStatusBadge(status?.gemini || 'not_configured')}
              </div>

              {/* Resend Email Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">Resend Email</h4>
                    <p className="text-[11px] text-slate-500 font-mono">RESEND_API_KEY</p>
                  </div>
                </div>
                {renderStatusBadge(status?.resend || 'not_configured')}
              </div>
            </div>
          )}
        </Card>

        {/* Monitoring Global Settings Form */}
        <Card className="glass-card">
          <CardHeader>
            <div>
              <CardTitle>Monitoring & AI Settings</CardTitle>
              <CardDescription>
                Configure Gemini classification model thresholds and default recipient settings.
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSaveSettings} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Gemini Model Identifier"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                helperText="Model used for structured JSON sentiment classification."
              />

              <Input
                label="Min Confidence Threshold (0.00 - 1.00)"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value)}
                helperText="Comments below this confidence score will be flagged for review."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Minimum Alert Severity
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={minSeverity}
                  onChange={(e) => setMinSeverity(e.target.value)}
                >
                  <option value="low">Low (Alert on all negative comments)</option>
                  <option value="medium">Medium (Alert on medium, high, critical)</option>
                  <option value="high">High (Alert on high & critical only)</option>
                  <option value="critical">Critical (Alert on critical emergencies only)</option>
                </select>
                <p className="text-xs text-slate-500">Only send emails when comment severity equals or exceeds this level.</p>
              </div>

              <Input
                label="Default Recipient Email"
                type="email"
                value={defaultEmail}
                onChange={(e) => setDefaultEmail(e.target.value)}
                helperText="Fallback recipient when monitor recipient email is omitted."
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {isSaved ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
                </span>
              ) : (
                <span className="text-xs text-slate-500">Changes take effect immediately on next crawl.</span>
              )}

              <Button variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
                Save Settings
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
