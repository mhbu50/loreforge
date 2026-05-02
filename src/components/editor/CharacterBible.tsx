import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Sparkles, User } from 'lucide-react';
import { Modal } from '@/src/components/ui/Modal';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { useStoryStore, Character } from '@/src/stores/useStoryStore';
import { cn } from '@/src/lib/utils';

const ROLE_COLORS: Record<Character['role'], string> = {
  protagonist: 'from-violet-600 to-purple-800',
  antagonist:  'from-red-600 to-rose-800',
  supporting:  'from-sky-600 to-blue-800',
  minor:       'from-slate-600 to-gray-800',
};

const ROLE_BADGE_VARIANT: Record<Character['role'], 'primary' | 'danger' | 'info' | 'default'> = {
  protagonist: 'primary',
  antagonist:  'danger',
  supporting:  'info',
  minor:       'default',
};

interface CharacterBibleProps {
  storyId: string;
  className?: string;
}

const EMPTY_CHAR: Omit<Character, 'id'> = {
  name: '',
  role: 'supporting',
  description: '',
  traits: [],
  backstory: '',
  arc: '',
};

export function CharacterBible({ storyId, className }: CharacterBibleProps) {
  const story = useStoryStore((s) => s.stories.find((st) => st.id === storyId));
  const addCharacter = useStoryStore((s) => s.addCharacter);
  const updateCharacter = useStoryStore((s) => s.updateCharacter);
  const deleteCharacter = useStoryStore((s) => s.deleteCharacter);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Character | null>(null);
  const [form, setForm] = useState<Omit<Character, 'id'>>(EMPTY_CHAR);
  const [traitInput, setTraitInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  if (!story) return null;

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_CHAR);
    setTraitInput('');
    setIsOpen(true);
  };

  const openEdit = (char: Character) => {
    setEditing(char);
    setForm({ name: char.name, role: char.role, description: char.description, traits: [...char.traits], backstory: char.backstory, arc: char.arc });
    setTraitInput('');
    setIsOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateCharacter(storyId, editing.id, form);
    } else {
      addCharacter(storyId, form);
    }
    setIsOpen(false);
  };

  const addTrait = () => {
    const t = traitInput.trim();
    if (t && !form.traits.includes(t)) {
      setForm((f) => ({ ...f, traits: [...f.traits, t] }));
    }
    setTraitInput('');
  };

  const removeTrait = (trait: string) => {
    setForm((f) => ({ ...f, traits: f.traits.filter((t) => t !== trait) }));
  };

  const selectedChar = story.characters.find((c) => c.id === selected);

  return (
    <div className={cn('flex h-full', className)}>
      {/* Character list */}
      <div className="flex w-52 flex-shrink-0 flex-col border-r border-border">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Characters</span>
          <button onClick={openNew} className="text-text-muted hover:text-primary transition-colors">
            <Plus size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1 space-y-0.5 px-1">
          {story.characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center px-2">
              <User size={22} className="text-text-muted" />
              <p className="text-xs text-text-muted">No characters yet</p>
              <button onClick={openNew} className="text-xs text-primary hover:underline">Add first character</button>
            </div>
          ) : (
            story.characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelected(char.id === selected ? null : char.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-sm px-2 py-2 text-left transition-colors',
                  selected === char.id ? 'bg-bg-tertiary border-l-2 border-primary' : 'hover:bg-bg-hover'
                )}
              >
                <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white', ROLE_COLORS[char.role])}>
                  {char.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{char.name}</p>
                  <p className="text-xs text-text-muted capitalize">{char.role}</p>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border p-2">
          <Button variant="secondary" size="sm" className="w-full" leftIcon={<Sparkles size={13} />} onClick={openNew}>
            Add Character
          </Button>
        </div>
      </div>

      {/* Character detail */}
      <div className="flex-1 overflow-y-auto">
        {selectedChar ? (
          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className={cn('flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl font-bold text-white', ROLE_COLORS[selectedChar.role])}>
                {selectedChar.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-text-primary">{selectedChar.name}</h2>
                <Badge variant={ROLE_BADGE_VARIANT[selectedChar.role]} className="mt-1 capitalize">{selectedChar.role}</Badge>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(selectedChar)} className="p-1.5 rounded-sm text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => { deleteCharacter(storyId, selectedChar.id); setSelected(null); }} className="p-1.5 rounded-sm text-text-muted hover:text-red-400 hover:bg-bg-tertiary transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {selectedChar.description && (
              <Section title="Description">
                <p className="text-sm text-text-secondary leading-relaxed">{selectedChar.description}</p>
              </Section>
            )}

            {selectedChar.traits.length > 0 && (
              <Section title="Traits">
                <div className="flex flex-wrap gap-1.5">
                  {selectedChar.traits.map((t) => (
                    <Badge key={t} variant="default">{t}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {selectedChar.backstory && (
              <Section title="Backstory">
                <p className="text-sm text-text-secondary leading-relaxed">{selectedChar.backstory}</p>
              </Section>
            )}

            {selectedChar.arc && (
              <Section title="Character Arc">
                <p className="text-sm text-text-secondary leading-relaxed">{selectedChar.arc}</p>
              </Section>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-8">
            <div className="h-14 w-14 rounded-xl bg-bg-tertiary flex items-center justify-center">
              <User size={24} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">Select a character to view details</p>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal open={isOpen} onOpenChange={setIsOpen} title={editing ? 'Edit Character' : 'New Character'} size="md">
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Character name"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['protagonist', 'antagonist', 'supporting', 'minor'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setForm((f) => ({ ...f, role }))}
                  className={cn(
                    'rounded-sm border px-3 py-2 text-sm capitalize transition-colors',
                    form.role === role
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-muted hover:border-hover hover:text-text-primary'
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Brief description…"
              className="w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Traits</label>
            <div className="flex gap-2">
              <input
                value={traitInput}
                onChange={(e) => setTraitInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTrait(); } }}
                placeholder="Add trait and press Enter"
                className="flex-1 rounded-sm border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
              <Button size="sm" variant="secondary" onClick={addTrait}>Add</Button>
            </div>
            {form.traits.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.traits.map((t) => (
                  <button key={t} onClick={() => removeTrait(t)} className="flex items-center gap-1 rounded-full bg-bg-tertiary border border-border px-2.5 py-0.5 text-xs text-text-secondary hover:border-red-500 hover:text-red-400 transition-colors">
                    {t} <span>×</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Backstory</label>
            <textarea
              value={form.backstory}
              onChange={(e) => setForm((f) => ({ ...f, backstory: e.target.value }))}
              rows={3}
              placeholder="Character backstory…"
              className="w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Character Arc</label>
            <textarea
              value={form.arc}
              onChange={(e) => setForm((f) => ({ ...f, arc: e.target.value }))}
              rows={2}
              placeholder="How does this character change?…"
              className="w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!form.name.trim()}>
              {editing ? 'Save Changes' : 'Create Character'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h4>
      {children}
    </div>
  );
}
