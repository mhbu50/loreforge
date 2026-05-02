import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Key, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { MainLayout } from './layout/MainLayout';
import { TopBar } from './layout/TopBar';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Slider } from './ui/Slider';
import { Card, CardHeader, CardTitle } from './ui/Card';

type SettingsTab = 'account' | 'appearance' | 'ai' | 'data' | 'shortcuts';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'ai', label: 'AI Config' },
  { id: 'data', label: 'Data & Export' },
  { id: 'shortcuts', label: 'Shortcuts' },
];

const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'S'], action: 'Save story' },
  { keys: ['Ctrl', 'Z'], action: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
  { keys: ['Ctrl', 'Shift', 'A'], action: 'Toggle AI panel' },
  { keys: ['Ctrl', 'P'], action: 'Command palette' },
  { keys: ['Escape'], action: 'Close panel / Exit zen mode' },
];

const AI_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Fast and capable' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'High accuracy' },
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'OpenAI (requires key)' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', desc: 'Anthropic (requires key)' },
];

export default function AppSettings() {
  const [tab, setTab] = useState<SettingsTab>('account');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('storycraft-theme') as any) || 'light';
  });
  const [fontSize, setFontSize] = useState(14);
  const [temperature, setTemperature] = useState(0.8);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t);
    const resolved = t === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : t;
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('storycraft-theme', t);
  };

  return (
    <MainLayout>
      <TopBar title="Settings" subtitle="Manage your preferences" />

      <div className="flex-1 overflow-y-auto bg-bg-primary">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex gap-8">
            {/* Sidebar tabs */}
            <nav className="flex flex-col gap-0.5 w-44 flex-shrink-0">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    'flex items-center rounded-sm px-3 py-2 text-sm font-medium text-left transition-colors',
                    tab === id
                      ? 'bg-bg-tertiary text-primary border-l-[3px] border-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
                  )}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="flex-1 space-y-6">

              {/* Account */}
              {tab === 'account' && (
                <Card>
                  <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                      <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                    </div>
                    <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
                    <div className="pt-2">
                      <Button variant="primary" size="sm">Save Changes</Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Appearance */}
              {tab === 'appearance' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { id: 'light',  icon: Sun,     label: 'Light' },
                        { id: 'dark',   icon: Moon,    label: 'Dark' },
                        { id: 'system', icon: Monitor, label: 'System' },
                      ] as const).map(({ id, icon: Icon, label }) => (
                        <button
                          key={id}
                          onClick={() => applyTheme(id)}
                          className={cn(
                            'flex flex-col items-center gap-3 p-6 rounded-md border-2 transition-all',
                            theme === id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border text-text-muted hover:border-hover hover:text-text-primary'
                          )}
                        >
                          <Icon size={22} />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Typography</CardTitle>
                      <span className="text-sm text-primary">{fontSize}px</span>
                    </CardHeader>
                    <div className="space-y-3">
                      <label className="text-xs text-text-muted block">Base Font Size</label>
                      <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={20} step={1} />
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>12px</span><span>20px</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* AI Config */}
              {tab === 'ai' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>AI Model</CardTitle></CardHeader>
                    <div className="space-y-2">
                      {AI_MODELS.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={cn(
                            'w-full flex items-center justify-between rounded-sm border px-4 py-3 text-left transition-colors',
                            selectedModel === model.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-hover'
                          )}
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">{model.label}</p>
                            <p className="text-xs text-text-muted">{model.desc}</p>
                          </div>
                          {selectedModel === model.id && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>API Key</CardTitle>
                    </CardHeader>
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-... or AIza..."
                          className="w-full rounded-sm border border-border bg-bg-primary px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                        />
                        <button onClick={() => setShowKey((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                          {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <Button variant="primary" size="sm">Save API Key</Button>
                    </div>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Creativity (Temperature)</CardTitle>
                      <span className="text-sm text-primary">{temperature.toFixed(1)}</span>
                    </CardHeader>
                    <div className="space-y-3">
                      <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={0} max={1} step={0.1} />
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>Focused (0.0)</span><span>Creative (1.0)</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Data */}
              {tab === 'data' && (
                <Card>
                  <CardHeader><CardTitle>Export API Keys</CardTitle></CardHeader>
                  <div className="space-y-3">
                    {[
                      { label: 'Production', key: 'pk_live_••••••••••••' },
                      { label: 'Development', key: 'pk_dev_••••••••••••' },
                    ].map(({ label, key }) => (
                      <div key={label} className="flex items-center justify-between rounded-sm border border-border bg-bg-primary p-3">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{label}</p>
                          <p className="text-xs text-text-muted font-mono mt-0.5">{key}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
                            <Copy size={13} />
                          </button>
                          <button className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-bg-tertiary transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <Button variant="secondary" size="sm" className="w-full" leftIcon={<Plus size={13} />}>
                      Generate New Key
                    </Button>
                  </div>
                </Card>
              )}

              {/* Shortcuts */}
              {tab === 'shortcuts' && (
                <Card>
                  <CardHeader><CardTitle>Keyboard Shortcuts</CardTitle></CardHeader>
                  <div className="space-y-1">
                    {KEYBOARD_SHORTCUTS.map(({ keys, action }) => (
                      <div key={action} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                        <span className="text-sm text-text-secondary">{action}</span>
                        <div className="flex items-center gap-1">
                          {keys.map((k, i) => (
                            <React.Fragment key={k}>
                              {i > 0 && <span className="text-xs text-text-muted">+</span>}
                              <kbd className="rounded bg-bg-tertiary border border-border px-2 py-0.5 text-xs font-mono text-text-primary">{k}</kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
