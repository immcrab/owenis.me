import { httpsCallable } from "firebase/functions";
import { motion } from "framer-motion";
import { Bot, Send, ShieldCheck, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { functions } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How do I connect my Firebase project?",
  "What DNS records do I need?",
  "What does an action URL do?",
  "How do subdomain requests work?",
];

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I can help explain how owenis.me works — connecting Firebase, email templates, action URLs, DNS, and subdomain requests. What do you need?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const fn = httpsCallable<unknown, { reply: string }>(functions, "aiAssistant");
      const res = await fn({
        message: text,
        history: nextMessages.slice(-8),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? `Sorry, something went wrong: ${err.message}` : "Sorry, something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <PageHeader title="AI assistant" description="Answers public documentation only — never your account data." />

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text-tertiary)]">
        <ShieldCheck size={14} className="text-[var(--color-accent)]" />
        This assistant has no access to user data, private project settings, or the database.
      </div>

      <div ref={scrollRef} className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
        {messages.map((message, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                message.role === "assistant"
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]",
              )}
            >
              {message.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                message.role === "assistant"
                  ? "bg-[var(--color-elevated)] text-[var(--color-text-primary)]"
                  : "bg-[var(--color-accent)] text-[#1a0f0a]",
              )}
            >
              {message.role === "assistant" ? (
                <div className="chat-markdown">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              <Bot size={16} />
            </div>
            <div className="flex gap-1 rounded-xl bg-[var(--color-elevated)] px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-[var(--color-text-tertiary)]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 pl-4 transition-colors focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="h-10 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
        />
        <Button
          type="submit"
          size="md"
          loading={loading}
          icon={<Send size={16} />}
          disabled={!input.trim()}
          className="rounded-xl"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
