'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Building2,
  Plug,
  Bell,
  Palette,
  Receipt,
  Database,
  Info,
  Save,
  CheckCircle2,
  Upload,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LegalSettings {
  // Profile
  firmName: string;
  oabNumber: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;

  // Integrations
  datajudEnabled: boolean;
  pjeEnabled: boolean;
  esajEnabled: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;

  // Notifications
  emailAlertsEnabled: boolean;
  deadlineReminderDays: number[];
  movementAlertsEnabled: boolean;
  whatsappAlertsEnabled: boolean;

  // Appearance
  theme: 'dark';
  accentColor: 'gold' | 'silver' | 'blue' | 'emerald';

  // Tax
  regimeTributario: 'simples' | 'presumido' | 'real';
  issCity: string;
  aliquotaIss: number;
  aliquotaInss: number;
  aliquotaIr: number;
}

const DEFAULT_SETTINGS: LegalSettings = {
  firmName: 'Advocacia APEX',
  oabNumber: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  website: '',
  datajudEnabled: false,
  pjeEnabled: false,
  esajEnabled: false,
  whatsappEnabled: false,
  emailEnabled: false,
  emailAlertsEnabled: true,
  deadlineReminderDays: [1, 3, 7],
  movementAlertsEnabled: true,
  whatsappAlertsEnabled: false,
  theme: 'dark',
  accentColor: 'gold',
  regimeTributario: 'simples',
  issCity: '',
  aliquotaIss: 5,
  aliquotaInss: 11,
  aliquotaIr: 15,
};

const STORAGE_KEY = 'apex-legal-settings-v1';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[#1a2d52]/60 bg-[#0d1f3c] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-6 py-4 hover:bg-[#1a2d52]/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C0C0C0]/10">
            <Icon className="h-4 w-4 text-[#C0C0C0]" />
          </div>
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[#4A5568]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#4A5568]" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-[#1a2d52]/60">
          <div className="pt-5">{children}</div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
      <div className="sm:w-48 flex-shrink-0 pt-1">
        <span className="text-sm font-medium text-[#A0AEC0]">{label}</span>
        {hint && <p className="text-xs text-[#4A5568] mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#C0C0C0]/30 focus:border-[#C0C0C0]/30 transition-colors"
    />
  );
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center transition-colors ${enabled ? 'text-[#D4AF37]' : 'text-[#4A5568]'}`}
    >
      {enabled ? (
        <ToggleRight className="h-6 w-6" />
      ) : (
        <ToggleLeft className="h-6 w-6" />
      )}
    </button>
  );
}

function IntegrationRow({
  name,
  description,
  enabled,
  onToggle,
  statusColor,
}: {
  name: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  statusColor: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1a2d52]/40 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`h-2 w-2 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-[#4A5568]'}`}
        />
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-[#4A5568]">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${statusColor}`}>
          {enabled ? 'Ativo' : 'Inativo'}
        </span>
        <Toggle enabled={enabled} onChange={onToggle} />
        <button className="text-xs text-[#4A5568] hover:text-[#A0AEC0] flex items-center gap-1 transition-colors">
          Configurar
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LegalSettingsPage() {
  const [settings, setSettings] = useState<LegalSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const update = useCallback(<K extends keyof LegalSettings>(key: K, value: LegalSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  const toggleReminderDay = useCallback((day: number) => {
    setSettings((prev) => {
      const days = prev.deadlineReminderDays.includes(day)
        ? prev.deadlineReminderDays.filter((d) => d !== day)
        : [...prev.deadlineReminderDays, day].sort((a, b) => a - b);
      return { ...prev, deadlineReminderDays: days };
    });
    setDirty(true);
    setSaved(false);
  }, []);

  const handleExportData = useCallback(() => {
    const keys = [
      'apex-legal-settings-v1',
      'apex-legal-store',
      'apex-legal-financial-store',
    ];
    const data: Record<string, unknown> = {};
    keys.forEach((k) => {
      try {
        const v = localStorage.getItem(k);
        if (v) data[k] = JSON.parse(v);
      } catch {
        // skip
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apex-legal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClearCache = useCallback(() => {
    if (window.confirm('Limpar cache? Os dados salvos localmente serão removidos.')) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const ACCENT_COLORS: { key: LegalSettings['accentColor']; label: string; preview: string }[] = [
    { key: 'gold', label: 'Ouro', preview: '#D4AF37' },
    { key: 'silver', label: 'Prata', preview: '#C0C0C0' },
    { key: 'blue', label: 'Azul', preview: '#3B82F6' },
    { key: 'emerald', label: 'Esmeralda', preview: '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-[#060d1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="h-7 w-7 text-[#C0C0C0]" />
            Configurações
          </h1>
          <p className="text-sm text-[#4A5568] mt-1">
            Personalize o APEX Legal Performance para seu escritório
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all shadow-lg ${
            saved
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : dirty
              ? 'bg-[#D4AF37] text-black hover:bg-[#C09B2A] shadow-[#D4AF37]/20'
              : 'bg-[#1a2d52] text-[#4A5568] border border-[#1a2d52]/60 cursor-default'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </button>
      </div>

      {/* 1. Profile / Firma */}
      <SectionCard title="Perfil do Escritório" icon={Building2}>
        <div className="space-y-5">
          <FieldRow label="Nome do Escritório">
            <Input
              value={settings.firmName}
              onChange={(v) => update('firmName', v)}
              placeholder="Ex: Silva & Associados Advocacia"
            />
          </FieldRow>

          <FieldRow label="OAB" hint="Número da carteira OAB">
            <Input
              value={settings.oabNumber}
              onChange={(v) => update('oabNumber', v)}
              placeholder="Ex: OAB/SP 123.456"
            />
          </FieldRow>

          {/* Logo upload area */}
          <FieldRow label="Logo" hint="PNG ou SVG, máx. 2 MB">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-[#1a2d52]/80 bg-[#060d1a] text-[#4A5568]">
                <Building2 className="h-6 w-6" />
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] px-4 py-2 text-sm text-[#A0AEC0] hover:border-[#C0C0C0]/30 hover:text-white transition-colors">
                <Upload className="h-4 w-4" />
                Fazer Upload
              </button>
            </div>
          </FieldRow>

          <div className="border-t border-[#1a2d52]/40 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="E-mail de Contato">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => update('contactEmail', e.target.value)}
                  placeholder="contato@escritorio.adv.br"
                  className="w-full rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] pl-10 pr-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#C0C0C0]/30 focus:border-[#C0C0C0]/30 transition-colors"
                />
              </div>
            </FieldRow>

            <FieldRow label="Telefone">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
                <input
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => update('contactPhone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] pl-10 pr-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#C0C0C0]/30 focus:border-[#C0C0C0]/30 transition-colors"
                />
              </div>
            </FieldRow>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="Website">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
                <input
                  type="url"
                  value={settings.website}
                  onChange={(e) => update('website', e.target.value)}
                  placeholder="https://escritorio.adv.br"
                  className="w-full rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] pl-10 pr-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#C0C0C0]/30 focus:border-[#C0C0C0]/30 transition-colors"
                />
              </div>
            </FieldRow>

            <FieldRow label="Endereço">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Rua, número"
                  className="w-full rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] pl-10 pr-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#C0C0C0]/30 focus:border-[#C0C0C0]/30 transition-colors"
                />
              </div>
            </FieldRow>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FieldRow label="Cidade">
              <Input
                value={settings.city}
                onChange={(v) => update('city', v)}
                placeholder="São Paulo"
              />
            </FieldRow>
            <FieldRow label="Estado">
              <Input
                value={settings.state}
                onChange={(v) => update('state', v)}
                placeholder="SP"
              />
            </FieldRow>
            <FieldRow label="CEP">
              <Input
                value={settings.zipCode}
                onChange={(v) => update('zipCode', v)}
                placeholder="01310-100"
              />
            </FieldRow>
          </div>
        </div>
      </SectionCard>

      {/* 2. Integrations */}
      <SectionCard title="Integrações" icon={Plug}>
        <div className="space-y-0">
          <IntegrationRow
            name="DataJud"
            description="Consulta e sincronização de processos no CNJ"
            enabled={settings.datajudEnabled}
            onToggle={() => update('datajudEnabled', !settings.datajudEnabled)}
            statusColor={settings.datajudEnabled ? 'text-emerald-400' : 'text-[#4A5568]'}
          />
          <IntegrationRow
            name="PJe"
            description="Processo Judicial Eletrônico — tribunais federais e estaduais"
            enabled={settings.pjeEnabled}
            onToggle={() => update('pjeEnabled', !settings.pjeEnabled)}
            statusColor={settings.pjeEnabled ? 'text-emerald-400' : 'text-[#4A5568]'}
          />
          <IntegrationRow
            name="e-SAJ"
            description="Sistema do Tribunal de Justiça de São Paulo"
            enabled={settings.esajEnabled}
            onToggle={() => update('esajEnabled', !settings.esajEnabled)}
            statusColor={settings.esajEnabled ? 'text-emerald-400' : 'text-[#4A5568]'}
          />
          <IntegrationRow
            name="WhatsApp Business"
            description="Notificações e comunicação com clientes via WhatsApp"
            enabled={settings.whatsappEnabled}
            onToggle={() => update('whatsappEnabled', !settings.whatsappEnabled)}
            statusColor={settings.whatsappEnabled ? 'text-emerald-400' : 'text-[#4A5568]'}
          />
          <IntegrationRow
            name="E-mail (SMTP)"
            description="Envio de notificações e relatórios por e-mail"
            enabled={settings.emailEnabled}
            onToggle={() => update('emailEnabled', !settings.emailEnabled)}
            statusColor={settings.emailEnabled ? 'text-emerald-400' : 'text-[#4A5568]'}
          />
        </div>
      </SectionCard>

      {/* 3. Notifications */}
      <SectionCard title="Notificações" icon={Bell}>
        <div className="space-y-5">
          <FieldRow label="Alertas por E-mail" hint="Receber alertas de prazos e movimentações">
            <Toggle
              enabled={settings.emailAlertsEnabled}
              onChange={(v) => update('emailAlertsEnabled', v)}
            />
          </FieldRow>

          <FieldRow
            label="Lembrete de Prazo"
            hint="Quantos dias antes notificar"
          >
            <div className="flex items-center gap-2">
              {[1, 3, 7, 14, 30].map((day) => (
                <button
                  key={day}
                  onClick={() => toggleReminderDay(day)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                    settings.deadlineReminderDays.includes(day)
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30'
                      : 'bg-[#060d1a] text-[#4A5568] border-[#1a2d52]/80 hover:text-[#A0AEC0] hover:border-[#1a2d52]'
                  }`}
                >
                  {day}d
                </button>
              ))}
            </div>
          </FieldRow>

          <FieldRow label="Alertas de Movimentação" hint="Notificar quando houver movimentações nos processos">
            <Toggle
              enabled={settings.movementAlertsEnabled}
              onChange={(v) => update('movementAlertsEnabled', v)}
            />
          </FieldRow>

          <FieldRow label="Alertas via WhatsApp" hint="Requer integração WhatsApp ativa">
            <div className="flex items-center gap-3">
              <Toggle
                enabled={settings.whatsappAlertsEnabled && settings.whatsappEnabled}
                onChange={(v) => update('whatsappAlertsEnabled', v)}
              />
              {!settings.whatsappEnabled && (
                <span className="text-xs text-[#4A5568]">
                  (ative a integração WhatsApp primeiro)
                </span>
              )}
            </div>
          </FieldRow>
        </div>
      </SectionCard>

      {/* 4. Appearance */}
      <SectionCard title="Aparência" icon={Palette}>
        <div className="space-y-5">
          <FieldRow label="Tema" hint="Outros temas em breve">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#C0C0C0]/30 bg-[#C0C0C0]/5 px-3 py-2">
                <div className="h-3 w-3 rounded-full bg-[#060d1a] border border-[#4A5568]" />
                <span className="text-sm text-white font-medium">Escuro</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#D4AF37]" />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#1a2d52]/60 bg-transparent px-3 py-2 opacity-40 cursor-not-allowed">
                <div className="h-3 w-3 rounded-full bg-white border border-gray-300" />
                <span className="text-sm text-[#4A5568]">Claro</span>
                <span className="text-[10px] text-[#4A5568] bg-[#1a2d52] rounded px-1 py-0.5">em breve</span>
              </div>
            </div>
          </FieldRow>

          <FieldRow label="Cor de Destaque">
            <div className="flex items-center gap-3">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => update('accentColor', c.key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    settings.accentColor === c.key
                      ? 'border-white/20 bg-white/5'
                      : 'border-[#1a2d52]/60 bg-transparent hover:border-[#1a2d52]'
                  }`}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: c.preview }}
                  />
                  <span className="text-[#A0AEC0] text-xs">{c.label}</span>
                  {settings.accentColor === c.key && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                </button>
              ))}
            </div>
          </FieldRow>
        </div>
      </SectionCard>

      {/* 5. Tax Config */}
      <SectionCard title="Configuração Tributária" icon={Receipt}>
        <div className="space-y-5">
          <FieldRow label="Regime Tributário">
            <div className="flex items-center gap-2">
              {(
                [
                  { key: 'simples', label: 'Simples Nacional' },
                  { key: 'presumido', label: 'Lucro Presumido' },
                  { key: 'real', label: 'Lucro Real' },
                ] as { key: LegalSettings['regimeTributario']; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => update('regimeTributario', opt.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                    settings.regimeTributario === opt.key
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30'
                      : 'bg-[#060d1a] text-[#4A5568] border-[#1a2d52]/80 hover:text-[#A0AEC0] hover:border-[#1a2d52]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FieldRow>

          <FieldRow label="Município ISS" hint="Cidade de recolhimento do ISS">
            <Input
              value={settings.issCity}
              onChange={(v) => update('issCity', v)}
              placeholder="São Paulo - SP"
            />
          </FieldRow>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldRow label="Alíquota ISS (%)" hint="Padrão: 5%">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={String(settings.aliquotaIss)}
                  onChange={(v) => update('aliquotaIss', parseFloat(v) || 0)}
                  placeholder="5"
                />
                <span className="text-sm text-[#4A5568]">%</span>
              </div>
            </FieldRow>
            <FieldRow label="Alíquota INSS (%)" hint="Honorários">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={String(settings.aliquotaInss)}
                  onChange={(v) => update('aliquotaInss', parseFloat(v) || 0)}
                  placeholder="11"
                />
                <span className="text-sm text-[#4A5568]">%</span>
              </div>
            </FieldRow>
            <FieldRow label="Alíquota IR (%)" hint="Retenção na fonte">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={String(settings.aliquotaIr)}
                  onChange={(v) => update('aliquotaIr', parseFloat(v) || 0)}
                  placeholder="15"
                />
                <span className="text-sm text-[#4A5568]">%</span>
              </div>
            </FieldRow>
          </div>
        </div>
      </SectionCard>

      {/* 6. Data */}
      <SectionCard title="Dados & Backup" icon={Database}>
        <div className="space-y-4">
          <p className="text-xs text-[#4A5568]">
            Todos os dados são armazenados localmente no seu navegador. Faça backup regularmente.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 justify-center rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] px-4 py-2.5 text-sm text-[#A0AEC0] hover:border-[#C0C0C0]/30 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar Dados
            </button>

            <label className="flex items-center gap-2 justify-center rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] px-4 py-2.5 text-sm text-[#A0AEC0] hover:border-[#C0C0C0]/30 hover:text-white transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              Importar Dados
              <input type="file" accept=".json" className="hidden" />
            </label>

            <button
              onClick={() => {
                try {
                  Object.keys(localStorage).forEach((k) => {
                    if (k.startsWith('apex-legal')) {
                      // Only clear cache-like keys, not data
                    }
                  });
                  // For demo, just show confirm
                  if (window.confirm('Recarregar cache do sistema?')) {
                    window.location.reload();
                  }
                } catch {
                  // ignore
                }
              }}
              className="flex items-center gap-2 justify-center rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] px-4 py-2.5 text-sm text-[#A0AEC0] hover:border-[#C0C0C0]/30 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Limpar Cache
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1a2d52]/40">
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Apagar Todos os Dados Locais
            </button>
            <p className="mt-2 text-xs text-[#4A5568]">
              Atenção: esta ação é irreversível e removerá todos os dados do navegador.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* 7. About */}
      <SectionCard title="Sobre" icon={Info} defaultOpen={false}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* APEX Triangle Mark */}
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a2d52] to-[#0d1f3c] border border-[#C0C0C0]/10 shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="APEX">
                <defs>
                  <linearGradient id="apex-about" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#E8E8ED" />
                    <stop offset="45%" stopColor="#C0C0C0" />
                    <stop offset="75%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#B8941F" />
                  </linearGradient>
                </defs>
                <path d="M12 2L22 20H2L12 2Z" fill="url(#apex-about)" />
                <rect x="7" y="13.5" width="10" height="2" rx="1" fill="#0a1628" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">APEX Legal Performance</h3>
              <p className="text-sm text-[#4A5568]">Versão 1.0.0</p>
            </div>
          </div>

          <div className="rounded-lg border border-[#1a2d52]/60 bg-[#060d1a] p-4 space-y-2 text-xs text-[#4A5568] font-mono">
            <div className="flex items-center justify-between">
              <span>Versão</span>
              <span className="text-[#A0AEC0]">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Build</span>
              <span className="text-[#A0AEC0]">2026.06.04</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Ambiente</span>
              <span className="text-[#A0AEC0]">Produção</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Framework</span>
              <span className="text-[#A0AEC0]">Next.js 16 + React 19</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="mailto:suporte@apex.legal"
              className="flex items-center gap-2 rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] px-4 py-2 text-sm text-[#A0AEC0] hover:border-[#C0C0C0]/30 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4" />
              Suporte
            </a>
            <a
              href="https://apex.legal/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] px-4 py-2 text-sm text-[#A0AEC0] hover:border-[#C0C0C0]/30 hover:text-white transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Documentação
            </a>
          </div>
        </div>
      </SectionCard>

      {/* Sticky Save Bar (when dirty) */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-xl border border-[#D4AF37]/30 bg-[#0d1f3c] px-6 py-3 shadow-2xl shadow-black/50">
          <span className="text-sm text-[#A0AEC0]">Você tem alterações não salvas</span>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#C09B2A] transition-colors"
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
