import React, { useState } from 'react';
import { Plus, Search, Sparkles, Trash2, Edit3, Users } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStoryStore, Character, Story } from '@/src/stores/useStoryStore';
import { MainLayout } from './layout/MainLayout';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';

const ROLE_GRADIENTS: Record<Character['role'], string> = {
  protagonist: 'from-gold/40 to-gold/10',
  antagonist:  'from-magenta/40 to-magenta/10',
  supporting:  'from-cyan/40 to-cyan/10',
  minor:       'from-white/10 to-white/5',
};

const ROLE_BADGE: Record<Character['role'], 'gold' | 'magenta' | 'cyan' | 'default'> = {
  protagonist: 'gold', antagonist: 'magenta', supporting: 'cyan', minor: 'default',
};

interface CharForm {
  name: string; role: Character['role']; description: string;
  traits: string[]; backstory: string; arc: string;
}
const EMPTY: CharForm = { name: '', role: 'supporting', description: '', traits: [], backstory: '', arc: '' };

export default function AppCharacters() {
  const stories = useStoryStore((s) => s.stories);
  const addCharacter = useStoryStore((s) => s.addCharacter);
  const updateCharacter = useStoryStore((s) => s.updateCharacter);
  const deleteCharacter = useStoryStore((s) => s.deleteCharacter);

  const [search, setSearch] = useState('');
  const [storyFilter, setStoryFilter] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ storyId: string; char: Character } | null>(null);
  const [form, setForm] = useState<CharForm>(EMPTY);
  const [traitInput, setTraitInput] = useState('');
  const [targetStoryId, setTargetStoryId] = useState(stories[0]?.id ?? '');

  const allChars = stories.flatMap((s) =>
    s.characters.map((c) => ({ ...c, storyId: s.id, storyTitle: s.title }))
  );
  const filtered = allChars.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchStory = storyFilter === 'all' || c.storyId === storyFilter;
    return matchSearch && matchStory;
  });

  const openNew = () => { setEditing(null); setForm(EMPTY); setTraitInput(''); setTargetStoryId(stories[0]?.id ?? ''); setIsOpen(true); };
  const openEdit = (storyId: string, char: Character) => {
    setEditing({ storyId, char });
    setForm({ name: char.name, role: char.role, description: char.description, traits: [...char.traits], backstory: char.backstory, arc: char.arc });
    setTraitInput(''); setIsOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    if (editing) updateCharacter(editing.storyId, editing.char.id, form);
    else addCharacter(targetStoryId, form);
    setIsOpen(false);
  };
  const addTrait = () => {
    const t = traitInput.trim();
    if (t && !form.traits.includes(t)) setForm((f) => ({ ...f, traits: [...f.traits, t] }));
    setTraitInput('');
  };

  return (
    <MainLayout
      title="Characters"
      subtitle={`${allChars.length} character${allChars.length !== 1 ? 's' : ''} across all stories`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Sparkles size={13} />} disabled>AI Generate</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openNew} disabled={stories.length === 0}>New Character</Button>
        </div>
      }
    >
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-nebula pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search characters…"
              className="w-full rounded-full border border-white/[0.08] bg-void/80 pl-9 pr-4 py-2 text-sm text-starlight placeholder:text-nebula/60 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 backdrop-blur-sm" />
          </div>
          <select value={storyFilter} onChange={(e) => setStoryFilter(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-surface-glass backdrop-blur-xl px-3 py-2 text-sm text-starlight focus:outline-none focus:border-gold">
            <option value="all">All Stories</option>
            {stories.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gold/20 bg-surface-glass backdrop-blur-xl py-20 text-center gap-4">
            <Users size={32} className="text-nebula/50" />
            <div>
              <p className="font-serif text-lg text-starlight mb-1">No characters found</p>
              <p className="text-sm text-nebula">{stories.length === 0 ? 'Create a story first' : 'Add a character to get started'}</p>
            </div>
            {stories.length > 0 && <Button variant="primary" leftIcon={<Plus size={14} />} onClick={openNew}>New Character</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((char) => (
              <div key={char.id} className="group rounded-2xl border border-white/[0.06] bg-surface-glass backdrop-blur-xl shadow-card hover:shadow-card-hover hover:border-gold/20 transition-all duration-200 overflow-hidden">
                <div className={cn('relative flex items-center gap-3 p-4 bg-gradient-to-br', ROLE_GRADIENTS[char.role])}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-xl font-bold text-white">
                    {char.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-starlight line-clamp-1">{char.name}</p>
                    <p className="text-xs text-nebula">{char.storyTitle}</p>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(char.storyId, char)} className="p-1 rounded-lg bg-black/30 text-white hover:bg-black/50 transition-colors"><Edit3 size={12} /></button>
                    <button onClick={() => deleteCharacter(char.storyId, char.id)} className="p-1 rounded-lg bg-black/30 text-white hover:bg-magenta/60 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <Badge variant={ROLE_BADGE[char.role]} className="capitalize">{char.role}</Badge>
                  {char.description && <p className="text-xs text-nebula line-clamp-3">{char.description}</p>}
                  {char.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {char.traits.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-xs text-nebula">{t}</span>
                      ))}
                      {char.traits.length > 4 && <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-xs text-nebula">+{char.traits.length - 4}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={isOpen} onOpenChange={setIsOpen} title={editing ? 'Edit Character' : 'New Character'} size="md">
        <div className="space-y-4">
          {!editing && stories.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-nebula">Story</label>
              <select value={targetStoryId} onChange={(e) => setTargetStoryId(e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-void/80 px-3 py-2.5 text-sm text-starlight focus:outline-none focus:border-gold backdrop-blur-sm">
                {stories.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          )}
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Character name" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-nebula">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['protagonist', 'antagonist', 'supporting', 'minor'] as const).map((role) => (
                <button key={role} onClick={() => setForm((f) => ({ ...f, role }))}
                  className={cn('rounded-xl border px-3 py-2 text-sm capitalize transition-colors', form.role === role ? 'border-gold bg-gold/10 text-gold' : 'border-white/[0.08] text-nebula hover:border-white/20')}>
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-nebula">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.08] bg-void/80 px-4 py-3 text-sm text-starlight placeholder:text-nebula/60 focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 resize-none backdrop-blur-sm" placeholder="Brief description…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-nebula">Traits</label>
            <div className="flex gap-2">
              <input value={traitInput} onChange={(e) => setTraitInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTrait(); } }}
                placeholder="Add trait, press Enter"
                className="flex-1 rounded-xl border border-white/[0.08] bg-void/80 px-4 py-2.5 text-sm text-starlight placeholder:text-nebula/60 focus:outline-none focus:border-gold backdrop-blur-sm" />
              <Button size="sm" variant="secondary" onClick={addTrait}>Add</Button>
            </div>
            {form.traits.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.traits.map((t) => (
                  <button key={t} onClick={() => setForm((f) => ({ ...f, traits: f.traits.filter((x) => x !== t) }))}
                    className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.06] px-2.5 py-0.5 text-xs text-nebula hover:border-magenta/40 hover:text-magenta transition-colors">
                    {t} ×
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-nebula">Backstory</label>
            <textarea rows={3} value={form.backstory} onChange={(e) => setForm((f) => ({ ...f, backstory: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.08] bg-void/80 px-4 py-3 text-sm text-starlight placeholder:text-nebula/60 focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 resize-none backdrop-blur-sm" placeholder="Character backstory…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!form.name.trim()}>{editing ? 'Save Changes' : 'Create Character'}</Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
