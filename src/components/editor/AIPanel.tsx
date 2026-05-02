import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RefreshCw, Copy, ChevronDown, Wand2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { IconButton } from '@/src/components/ui/IconButton';
import { cn } from '@/src/lib/utils';

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_PROMPTS = [
  { label: 'Continue scene', prompt: 'Continue the current scene naturally, maintaining the tone and pacing.' },
  { label: 'Rephrase', prompt: 'Rephrase the last paragraph to improve flow and readability.' },
  { label: 'Add dialogue', prompt: 'Add a meaningful dialogue exchange that advances the plot or reveals character.' },
  { label: 'Describe setting', prompt: 'Add a vivid, immersive description of the setting using sensory details.' },
  { label: 'Raise tension', prompt: 'Heighten the tension in this scene through character reactions and conflict.' },
  { label: 'Fix pacing', prompt: 'Adjust the pacing — the current section feels too slow/rushed.' },
];

interface AIPanelProps {
  storyContext?: string;
  onInsert?: (text: string) => void;
  className?: string;
}

export function AIPanel({ storyContext, onInsert, className }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    setShowQuick(false);

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY ?? '' });
      const systemPrompt = storyContext
        ? `You are a creative writing assistant. Here is the current story context:\n\n${storyContext.slice(0, 2000)}\n\nHelp the writer with their request. Be specific, creative, and match the existing tone and style.`
        : 'You are a creative writing assistant. Help the writer craft compelling stories.';

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\nUser request: ' + text }] },
        ],
      });

      const reply = response.text ?? 'Sorry, no response generated.';
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Error generating response. Please check your API key.' }]);
    } finally {
      setLoading(false);
    }
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className={cn('flex flex-col h-full bg-[--bg-elev] border-l border-[--border]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[--border]">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-violet-400" />
          <span className="text-sm font-medium text-[--fg]">AI Assistant</span>
        </div>
        <IconButton label="Clear chat" size="sm" onClick={() => { setMessages([]); setShowQuick(true); }}>
          <RefreshCw size={14} />
        </IconButton>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && showQuick && (
          <div className="space-y-3">
            <p className="text-xs text-[--fg-subtle] font-medium uppercase tracking-wide">Quick prompts</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map(({ label, prompt }) => (
                <button
                  key={label}
                  onClick={() => send(prompt)}
                  className="rounded-lg border border-[--border] bg-[--bg] px-3 py-2 text-left text-xs text-[--fg-muted] hover:border-violet-500/50 hover:text-[--fg] transition-colors"
                >
                  <Wand2 size={11} className="mb-1 text-violet-400" />
                  <span className="block font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'rounded-xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-violet-500/15 text-[--fg] ml-4'
                : 'bg-[--bg] border border-[--border] text-[--fg-muted]'
            )}
          >
            {msg.content}
            {msg.role === 'assistant' && onInsert && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="primary" onClick={() => onInsert(msg.content)} leftIcon={<ChevronDown size={12} />}>
                  Insert
                </Button>
                <IconButton label="Copy" size="sm" onClick={() => navigator.clipboard.writeText(msg.content)}>
                  <Copy size={12} />
                </IconButton>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[--fg-subtle]">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <span>Generating…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[--border] p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask AI for help…"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-[--border-strong] bg-[--bg] px-3 py-2 text-sm text-[--fg] placeholder:text-[--fg-faint] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
          <Button size="sm" variant="primary" onClick={() => send(input)} disabled={!input.trim() || loading}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
