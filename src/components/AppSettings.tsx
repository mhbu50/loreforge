import React, { useState } from 'react';
import { Sun, Moon, Monitor, Key, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { MainLayout } from './layout/MainLayout';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Slider } from './ui/Slider';

type Tab = 'account' | 'appearance' | 'ai' | 'data' | 'shortcuts';
const TABS: { id: Tab; label: string }[] = [
  { id: 'account',    label: 'Account' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'ai',         label: 'AI Config' },
  { id: 'data',       label: 'Data & Export' },
  { id: 'shortcuts',  label: 'Shortcuts' },
];
const SHORTCUTS = [
  { keys: ['Ctrl', 'S'],       action: 'Save story' },
  { keys: ['Ctrl', 'Z'],       action: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
  { keys: ['Ctrl', 'Shift', 'A'], action: 'Toggle AI panel' },
  { keys: ['Ctrl', 'P'],       action: 'Command palette' },
  { keys: ['Escape'],          action: 'Close panel / Exit zen mode' },
];
const AI_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Fast and capable' },
  { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro',   desc: 'High accuracy' },
  { id: 'gpt-4o',           label: 'GPT-4o',            desc: 'OpenAI (requires key)' },
  { id: 'claude-3-5-sonnet',label: 'Claude 3.5 Sonnet', desc: 'Anthropic (requires key)' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-glass backdrop-blur-xl p-6 shadow-card space-y-5">
      <h3 className="font-serif text-lg text-starlight">{title}</h3>
      {children}
    </div>
  );
}

export default function AppSettings() {
  const [tab, setTab] = useState<Tab>('account');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [fontSize, setFontSize] = useState(14);
  const [temperature, setTemperature] = useState(0.8);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <MainLayout title="Settings" subtitle="Manage your preferences">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-8">
          {/* Sidebar tabs */}
          <nav className="flex flex-col gap-0.5 w-44 flex-shrink-0">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn('flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors',
                  tab === id ? 'bg-gold/15 text-gold border-l-2 border-gold' : 'text-nebula hover:text-starlight hover:bg-white/[0.04]')}>
                {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 space-y-5">
            {tab === 'account' && (
              <Section title="Profile Information">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                  <Input label="Last Name"  value={lastName}  onChange={(e) => setLastName(e.target.value)}  placeholder="Doe" />
                </div>
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
                <Button variant="primary" size="sm">Save Changes</Button>
              </Section>
            )}

            {tab === 'appearance' && (
              <div className="space-y-5">
                <Section title="Theme">
                  <div className="grid grid-cols-3 gap-3">
                    {([{ id: 'light', icon: Sun, label: 'Light' }, { id: 'dark', icon: Moon, label: 'Dark' }, { id: 'system', icon: Monitor, label: 'System' }] as const).map(({ id, icon: Icon, label }) => (
                      <button key={id} onClick={() => setTheme(id)}
                        className={cn('flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all',
                          theme === id ? 'border-gold bg-gold/10 text-gold shadow-glow' : 'border-white/[0.06] text-nebula hover:border-white/20 hover:text-starlight')}>
                        <Icon size={22} />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </Section>
                <Section title="Typography">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm text-nebula">Base Font Size</label>
                      <span className="text-sm text-gold">{fontSize}px</span>
                    </div>
                    <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={20} step={1} />
                    <div className="flex justify-between text-xs text-nebula/60"><span>12px</span><span>20px</span></div>
                  </div>
                </Section>
              </div>
            )}

            {tab === 'ai' && (
              <div className="space-y-5">
                <Section title="AI Model">
                  <div className="space-y-2">
                    {AI_MODELS.map((model) => (
                      <button key={model.id} onClick={() => setSelectedModel(model.id)}
                        className={cn('w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all',
                          selectedModel === model.id ? 'border-gold bg-gold/10' : 'border-white/[0.06] hover:border-white/20')}>
                        <div>
                          <p className="text-sm font-medium text-starlight">{model.label}</p>
                          <p className="text-xs text-nebula">{model.desc}</p>
                        </div>
                        {selectedModel === model.id && <div className="h-2 w-2 rounded-full bg-gold shadow-glow" />}
                      </button>
                    ))}
                  </div>
                </Section>
                <Section title="API Key">
                  <div className="space-y-3">
                    <div className="relative">
                      <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-... or AIza..."
                        className="w-full rounded-xl border border-white/[0.08] bg-void/80 px-4 py-3 pr-11 text-sm text-starlight placeholder:text-nebula/60 focus:outline-none focus:border-gold backdrop-blur-sm" />
                      <button onClick={() => setShowKey((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-nebula hover:text-starlight transition-colors">
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Button variant="primary" size="sm">Save API Key</Button>
                  </div>
                </Section>
                <Section title="Creativity (Temperature)">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm text-nebula">Temperature</label>
                      <span className="text-sm text-gold">{temperature.toFixed(1)}</span>
                    </div>
                    <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={0} max={1} step={0.1} />
                    <div className="flex justify-between text-xs text-nebula/60"><span>Focused (0.0)</span><span>Creative (1.0)</span></div>
                  </div>
                </Section>
              </div>
            )}

            {tab === 'data' && (
              <Section title="Export API Keys">
                <div className="space-y-3">
                  {[{ label: 'Production', key: 'pk_live_••••••••' }, { label: 'Development', key: 'pk_dev_••••••••' }].map(({ label, key }) => (
                    <div key={label} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-void/40 p-3">
                      <div>
                        <p className="text-sm font-medium text-starlight">{label}</p>
                        <p className="text-xs text-nebula font-mono mt-0.5">{key}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button className="p-1.5 rounded-lg text-nebula hover:text-starlight hover:bg-white/[0.06] transition-colors"><Copy size={13} /></button>
                        <button className="p-1.5 rounded-lg text-nebula hover:text-magenta hover:bg-white/[0.06] transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" className="w-full" leftIcon={<Plus size={13} />}>Generate New Key</Button>
                </div>
              </Section>
            )}

            {tab === 'shortcuts' && (
              <Section title="Keyboard Shortcuts">
                <div className="space-y-1">
                  {SHORTCUTS.map(({ keys, action }) => (
                    <div key={action} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                      <span className="text-sm text-nebula">{action}</span>
                      <div className="flex items-center gap-1">
                        {keys.map((k, i) => (
                          <React.Fragment key={k}>
                            {i > 0 && <span className="text-xs text-nebula/40">+</span>}
                            <kbd className="rounded-lg bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 text-xs font-mono text-starlight">{k}</kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
