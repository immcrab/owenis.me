import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MessageSquareText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { searchHelpTopics } from "@/lib/helpContent";

export default function Docs() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>("connect-firebase");
  const topics = useMemo(() => searchHelpTopics(search), [search]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div>
        <h1 className="font-serif text-4xl italic leading-tight text-[var(--color-text-primary)] sm:text-5xl">
          Documentation
        </h1>
        <p className="mt-4 text-[var(--color-text-secondary)]">
          Answers to common questions. For anything else, ask the AI assistant from your dashboard.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search docs…"
          suffix={<Search size={16} className="text-[var(--color-text-tertiary)]" />}
          className="sm:max-w-xs"
        />
        <Link to="/sign-in" className={buttonVariants("outline", "md")}>
          <MessageSquareText size={16} /> Ask the AI assistant
        </Link>
      </div>

      <div className="mt-8 divide-y divide-[var(--color-border-subtle)] rounded-xl border border-[var(--color-border)]">
        {topics.length === 0 ? (
          <EmptyState icon={Search} title="No results" description="Try a different search term." />
        ) : (
          topics.map((topic) => {
            const open = openId === topic.id;
            return (
              <div key={topic.id}>
                <button
                  onClick={() => setOpenId(open ? null : topic.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-[var(--color-text-primary)]">{topic.title}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {topic.body}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
