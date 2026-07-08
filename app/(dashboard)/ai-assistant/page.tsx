'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Bot, Send, Loader2, RotateCcw, ChevronDown, ChevronRight,
  Wrench, User, Zap,
} from 'lucide-react';
import { assistantApi, AssistantHistoryMessage, AssistantToolCall } from '@/lib/assistant-api';
import { usePageHeader } from '@/components/layout/page-header-context';

const SUGGESTED_PROMPTS = [
  { label: 'Reservations this week', prompt: 'How many reservations do I have checking in this week? Show a table.' },
  { label: 'Early check-ins', prompt: 'Do I have any reservations with early check-in requests? List them.' },
  { label: 'Guest inquiries', prompt: 'List my most recent guest inquiries with names and dates.' },
  { label: 'Late checkouts', prompt: 'Show all upcoming reservations with late checkout requests.' },
  { label: 'Property overview', prompt: 'Give me an overview of all my properties and their knowledge-base completion.' },
  { label: 'Active reservations', prompt: 'List all my accepted upcoming reservations sorted by check-in date.' },
];

const TOOL_LABEL: Record<string, string> = {
  list_properties:   'Listed properties',
  get_property:      'Fetched property details',
  list_reservations: 'Listed reservations',
  get_reservation:   'Fetched reservation',
  list_inquiries:    'Listed inquiries',
  get_inquiry:       'Fetched inquiry',
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: AssistantToolCall[];
  timestamp: Date;
}

/* ─── Markdown renderer ─────────────────────────────────────── */

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        /* Paragraphs */
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed text-sm text-foreground">{children}</p>
        ),
        /* Headings */
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-foreground mb-3 mt-4 first:mt-0 pb-1 border-b border-border">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-foreground mb-2 mt-4 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-foreground mb-2 mt-3 first:mt-0">{children}</h3>
        ),
        /* Bold / italic */
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-muted-foreground">{children}</em>
        ),
        /* Unordered list */
        ul: ({ children }) => (
          <ul className="mb-3 last:mb-0 space-y-1 pl-1">{children}</ul>
        ),
        /* Ordered list */
        ol: ({ children }) => (
          <ol className="mb-3 last:mb-0 space-y-1 pl-1 list-decimal list-inside">{children}</ol>
        ),
        /* List item */
        li: ({ children }) => (
          <li className="flex gap-2 text-sm text-foreground leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 [ol_&]:hidden" />
            <span className="flex-1">{children}</span>
          </li>
        ),
        /* Inline code */
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <pre className="bg-muted rounded-lg p-3 overflow-x-auto mb-3 last:mb-0">
                <code className="text-xs font-mono text-foreground">{children}</code>
              </pre>
            );
          }
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>
          );
        },
        /* Horizontal rule */
        hr: () => <hr className="my-3 border-border" />,
        /* Blockquote */
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic text-sm">{children}</blockquote>
        ),
        /* TABLE — the key rendering */
        table: ({ children }) => (
          <div className="my-3 w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/60">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2.5 text-sm text-foreground align-top">{children}</td>
        ),
        /* Links */
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ─── Tool call chip ─────────────────────────────────────────── */

function ToolCallChip({ call, index }: { call: AssistantToolCall; index: number }) {
  const [open, setOpen] = useState(false);
  const label = TOOL_LABEL[call.name] ?? call.name;
  const argEntries = Object.entries(call.arguments);

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden text-xs">
      <button
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="h-4 w-4 rounded bg-primary/10 flex items-center justify-center shrink-0">
          <Wrench className="h-2.5 w-2.5 text-primary" />
        </div>
        <span className="font-medium text-foreground/70">{label}</span>
        {argEntries.length > 0 && (
          <span className="text-muted-foreground/60 truncate max-w-[200px]">
            {argEntries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(' · ')}
          </span>
        )}
        <span className="ml-auto shrink-0">
          {open
            ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
            : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-border/60 bg-muted/10">
          <pre className="px-3 py-2.5 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-56 overflow-auto leading-relaxed">
            {JSON.stringify(call.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ─── Message bubble ─────────────────────────────────────────── */

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[75%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-[10px] text-muted-foreground text-right mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0 max-w-[85%]">
        {/* Tool call chips — above the answer */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {message.toolCalls.map((call, i) => (
              <ToolCallChip key={i} call={call} index={i} />
            ))}
          </div>
        )}

        {/* Answer card */}
        <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-sm">
          <MarkdownContent content={message.content} />
        </div>

        <p className="text-[10px] text-muted-foreground mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <span className="ml-2 text-primary/60">
              · {message.toolCalls.length} {message.toolCalls.length === 1 ? 'query' : 'queries'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ─── Thinking indicator ─────────────────────────────────────── */

function ThinkingIndicator() {
  return (
    <div className="flex justify-start gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2.5">
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
        </span>
        <span className="text-xs text-muted-foreground">Querying your live data…</span>
      </div>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────── */

function EmptyState({ onPrompt, disabled }: { onPrompt: (p: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-10 px-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
        <Zap className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground text-base mb-1">Your AI data assistant</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
        Ask anything about your live properties, reservations, and guests. I'll query your real data to answer.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {SUGGESTED_PROMPTS.map(({ label, prompt }) => (
          <button
            key={label}
            onClick={() => onPrompt(prompt)}
            disabled={disabled}
            className="text-left px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="text-xs font-medium text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function AiAssistantPage() {
  usePageHeader({ title: 'Ask AI', description: 'Query your live reservations, properties, and guests in natural language' });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildHistory = useCallback((): AssistantHistoryMessage[] =>
    messages.map((m) => ({ role: m.role, content: m.content })),
    [messages],
  );

  const sendMessage = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = buildHistory();
      const result = await assistantApi.query(question, history);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.answer,
          toolCalls: result.toolCalls,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**Something went wrong.** ${err?.response?.data?.message ?? err.message ?? 'Please try again.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [loading, buildHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-0">
      {/* Conversation + sidebar */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* ── Thread ── */}
        <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-background overflow-hidden">

          {/* Topbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-card/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium">Live data connection</span>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setMessages([]); setInput(''); textareaRef.current?.focus(); }}
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                New conversation
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {isEmpty
              ? <EmptyState onPrompt={sendMessage} disabled={loading} />
              : messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            }
            {loading && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-border px-4 py-3 shrink-0 bg-card/30">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your reservations, properties, or guests…"
                  className="resize-none min-h-[44px] max-h-36 text-sm pr-3 bg-background border-border focus:border-primary/50"
                  rows={1}
                  disabled={loading}
                />
              </div>
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="shrink-0 h-[44px] w-[44px]"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-0.5">
              Enter to send · Shift+Enter for new line · answers use live database data
            </p>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="w-56 shrink-0 flex flex-col gap-3">

          {/* Quick prompts */}
          <Card className="flex-1">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Quick queries</CardTitle>
              <CardDescription className="text-[11px]">Click to send</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-4 space-y-1">
              {SUGGESTED_PROMPTS.map(({ label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-foreground/80"
                >
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground">Tips</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2 text-[11px] text-muted-foreground">
              <p>Expand the <span className="font-mono bg-muted px-1 rounded text-[10px]">query</span> chips to see raw data.</p>
              <p>Ask follow-up questions — context is remembered for this session.</p>
              <p>Use "this week", "next month" etc — I know today's date.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
