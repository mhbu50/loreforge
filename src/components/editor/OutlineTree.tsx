import React, { useState } from 'react';
import { ChevronRight, Plus, Trash2, GripVertical, Film, BookOpen, Layers } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStoryStore, OutlineNode } from '@/src/stores/useStoryStore';
import { IconButton } from '@/src/components/ui/IconButton';

const typeIcons = { act: Layers, chapter: BookOpen, scene: Film };
const typeColors = {
  act:     'text-violet-400 bg-violet-500/15',
  chapter: 'text-sky-400 bg-sky-500/15',
  scene:   'text-emerald-400 bg-emerald-500/15',
};

interface OutlineTreeProps {
  storyId: string;
  className?: string;
}

export function OutlineTree({ storyId, className }: OutlineTreeProps) {
  const story = useStoryStore((s) => s.stories.find((st) => st.id === storyId));
  const addNode = useStoryStore((s) => s.addOutlineNode);
  const updateNode = useStoryStore((s) => s.updateOutlineNode);
  const deleteNode = useStoryStore((s) => s.deleteOutlineNode);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);

  if (!story) return null;

  const rootNodes = story.outline.filter((n) => !n.parentId).sort((a, b) => a.order - b.order);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const NodeRow = ({ node, depth = 0 }: { node: OutlineNode; depth?: number }) => {
    const Icon = typeIcons[node.type];
    const children = story.outline.filter((n) => n.parentId === node.id).sort((a, b) => a.order - b.order);
    const isExpanded = expanded.has(node.id);
    const isEditing = editing === node.id;

    return (
      <div>
        <div
          className={cn(
            'group flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-[--bg-sunken] transition-colors cursor-pointer',
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => toggle(node.id)}
        >
          <GripVertical size={12} className="text-[--fg-faint] opacity-0 group-hover:opacity-100 flex-shrink-0" />
          {children.length > 0 && (
            <ChevronRight
              size={12}
              className={cn('flex-shrink-0 text-[--fg-subtle] transition-transform', isExpanded && 'rotate-90')}
            />
          )}
          {children.length === 0 && <div className="w-3" />}
          <span className={cn('flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs', typeColors[node.type])}>
            <Icon size={11} />
          </span>
          {isEditing ? (
            <input
              autoFocus
              defaultValue={node.title}
              className="flex-1 bg-transparent text-xs text-[--fg] outline-none border-b border-violet-500"
              onBlur={(e) => { updateNode(storyId, node.id, { title: e.target.value }); setEditing(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate text-xs text-[--fg-muted] group-hover:text-[--fg]" onDoubleClick={(e) => { e.stopPropagation(); setEditing(node.id); }}>
              {node.title}
            </span>
          )}
          <div className="flex opacity-0 group-hover:opacity-100 gap-0.5">
            {node.type !== 'scene' && (
              <IconButton
                label="Add child"
                size="sm"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  const childType = node.type === 'act' ? 'chapter' : 'scene';
                  addNode(storyId, { type: childType, parentId: node.id, order: children.length + 1 });
                  setExpanded((prev) => new Set([...prev, node.id]));
                }}
              >
                <Plus size={10} />
              </IconButton>
            )}
            <IconButton
              label="Delete"
              size="sm"
              className="h-5 w-5 hover:text-red-400"
              onClick={(e) => { e.stopPropagation(); deleteNode(storyId, node.id); }}
            >
              <Trash2 size={10} />
            </IconButton>
          </div>
        </div>
        {isExpanded && children.map((child) => (
          <NodeRow key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[--border]">
        <span className="text-xs font-medium text-[--fg-muted] uppercase tracking-wide">Outline</span>
        <IconButton label="Add act" size="sm" onClick={() => addNode(storyId, { type: 'act', order: rootNodes.length + 1 })}>
          <Plus size={14} />
        </IconButton>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rootNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
            <Layers size={24} className="text-[--fg-faint]" />
            <p className="text-xs text-[--fg-subtle]">Add acts to structure your story</p>
            <button
              onClick={() => addNode(storyId, { type: 'act', title: 'Act 1', order: 1 })}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              + Add first act
            </button>
          </div>
        ) : (
          rootNodes.map((node) => <NodeRow key={node.id} node={node} />)
        )}
      </div>
    </div>
  );
}
