import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Heading2, Heading3, Quote, Undo, Redo, Minus
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { IconButton } from '@/src/components/ui/IconButton';

interface TipTapEditorProps {
  content?: string;
  onChange?: (html: string, text: string, wordCount: number) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function TipTapEditor({ content = '', onChange, placeholder = 'Begin your story…', className, readOnly }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      onChange?.(html, text, wordCount);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const ToolbarBtn = ({ onClick, active, label, children }: {
    onClick: () => void; active?: boolean; label: string; children: React.ReactNode
  }) => (
    <IconButton
      label={label}
      size="sm"
      onClick={onClick}
      className={cn(active && 'bg-violet-500/20 text-violet-300')}
    >
      {children}
    </IconButton>
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[--border] px-3 py-1.5 bg-[--bg-elev]">
          <ToolbarBtn label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <Bold size={14} />
          </ToolbarBtn>
          <ToolbarBtn label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <Italic size={14} />
          </ToolbarBtn>
          <ToolbarBtn label="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <Strikethrough size={14} />
          </ToolbarBtn>
          <div className="mx-1 h-4 w-px bg-[--border]" />
          <ToolbarBtn label="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
            <Heading2 size={14} />
          </ToolbarBtn>
          <ToolbarBtn label="H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
            <Heading3 size={14} />
          </ToolbarBtn>
          <div className="mx-1 h-4 w-px bg-[--border]" />
          <ToolbarBtn label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
            <List size={14} />
          </ToolbarBtn>
          <ToolbarBtn label="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
            <ListOrdered size={14} />
          </ToolbarBtn>
          <ToolbarBtn label="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
            <Quote size={14} />
          </ToolbarBtn>
          <ToolbarBtn label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={14} />
          </ToolbarBtn>
          <div className="mx-1 h-4 w-px bg-[--border]" />
          <ToolbarBtn label="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo size={14} />
          </ToolbarBtn>
          <ToolbarBtn label="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo size={14} />
          </ToolbarBtn>
          <div className="ml-auto text-xs text-[--fg-subtle] pr-1">
            {editor.storage.characterCount?.words() ?? 0} words
          </div>
        </div>
      )}

      {/* Content */}
      <EditorContent
        editor={editor}
        className={cn(
          'flex-1 overflow-y-auto px-8 py-6',
          'prose prose-invert max-w-none prose-p:leading-7 prose-headings:font-semibold',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-full',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-[--fg-faint]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
        )}
      />
    </div>
  );
}
