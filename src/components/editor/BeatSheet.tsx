import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStoryStore, Beat } from '@/src/stores/useStoryStore';
import { IconButton } from '@/src/components/ui/IconButton';
import { Badge } from '@/src/components/ui/Badge';

const ACT_COLORS = {
  1: 'text-sky-400 border-sky-500/30',
  2: 'text-violet-400 border-violet-500/30',
  3: 'text-amber-400 border-amber-500/30',
};

interface BeatSheetProps {
  storyId: string;
  className?: string;
}

export function BeatSheet({ storyId, className }: BeatSheetProps) {
  const story = useStoryStore((s) => s.stories.find((st) => st.id === storyId));
  const addBeat = useStoryStore((s) => s.addBeat);
  const updateBeat = useStoryStore((s) => s.updateBeat);
  const deleteBeat = useStoryStore((s) => s.deleteBeat);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!story) return null;

  const beatsByAct = [1, 2, 3].map((act) => ({
    act: act as 1 | 2 | 3,
    beats: story.beats.filter((b) => b.actNumber === act).sort((a, b) => a.order - b.order),
  }));

  const completedCount = story.beats.filter((b) => b.completed).length;
  const totalCount = story.beats.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[--border]">
        <div>
          <span className="text-xs font-medium text-[--fg-muted] uppercase tracking-wide">Beat Sheet</span>
          {totalCount > 0 && (
            <span className="ml-2 text-xs text-[--fg-subtle]">{completedCount}/{totalCount}</span>
          )}
        </div>
        <IconButton label="Add beat" size="sm" onClick={() => addBeat(storyId, { actNumber: 1 })}>
          <Plus size={14} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {beatsByAct.map(({ act, beats }) => (
          <div key={act}>
            <div className="flex items-center gap-2 px-3 mb-1">
              <span className={cn('text-xs font-semibold', ACT_COLORS[act])}>Act {act}</span>
              <div className="flex-1 h-px bg-[--border]" />
              <button
                onClick={() => addBeat(storyId, { actNumber: act })}
                className="text-xs text-[--fg-subtle] hover:text-[--fg] transition-colors"
              >
                + add
              </button>
            </div>
            {beats.length === 0 ? (
              <p className="px-3 text-xs text-[--fg-faint] italic">No beats yet</p>
            ) : (
              beats.map((beat) => (
                <BeatRow
                  key={beat.id}
                  beat={beat}
                  isEditing={editingId === beat.id}
                  onEdit={() => setEditingId(beat.id)}
                  onStopEdit={() => setEditingId(null)}
                  onToggle={() => updateBeat(storyId, beat.id, { completed: !beat.completed })}
                  onUpdate={(data) => updateBeat(storyId, beat.id, data)}
                  onDelete={() => deleteBeat(storyId, beat.id)}
                />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BeatRow({ beat, isEditing, onEdit, onStopEdit, onToggle, onUpdate, onDelete }: {
  beat: Beat;
  isEditing: boolean;
  onEdit: () => void;
  onStopEdit: () => void;
  onToggle: () => void;
  onUpdate: (data: Partial<Beat>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-start gap-2 px-3 py-1.5 hover:bg-[--bg-sunken] rounded-lg mx-1 transition-colors">
      <GripVertical size={12} className="mt-0.5 text-[--fg-faint] opacity-0 group-hover:opacity-100 flex-shrink-0" />
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
        {beat.completed
          ? <CheckCircle2 size={14} className="text-emerald-400" />
          : <Circle size={14} className="text-[--fg-subtle]" />
        }
      </button>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            defaultValue={beat.title}
            className="w-full bg-transparent text-xs text-[--fg] outline-none border-b border-violet-500"
            onBlur={(e) => { onUpdate({ title: e.target.value }); onStopEdit(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        ) : (
          <p
            className={cn('text-xs truncate cursor-text', beat.completed ? 'line-through text-[--fg-faint]' : 'text-[--fg-muted]')}
            onDoubleClick={onEdit}
          >
            {beat.title}
          </p>
        )}
        {beat.description && (
          <p className="text-xs text-[--fg-faint] line-clamp-2 mt-0.5">{beat.description}</p>
        )}
      </div>
      <IconButton label="Delete beat" size="sm" className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:text-red-400" onClick={onDelete}>
        <Trash2 size={10} />
      </IconButton>
    </div>
  );
}
