"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  FolderInput,
  Pencil,
  MessageSquare,
  ExternalLink,
  Layers,
  BrainCircuit,
  Zap,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LibraryItem, Library } from "@/types/library";
import type { Conversation, Citation } from "@/types/chat";
import { StorageService } from "@/services/storage";
import { useAppStore } from "@/stores/app.store";
import { useChatStore } from "@/stores/chat.store";
import { useGenerationStore } from "@/stores/generation.store";
import ContentPreview from "./ContentPreview";
import StudyHistory from "./StudyHistory";
import GenerationModal from "@/components/generation/GenerationModal";

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "flashcards" | "citations" | "content";

interface CitationEntry {
  citation: Citation;
  userQuestion: string | null;
  conversation: Conversation | undefined;
}

interface DocumentDetailPageProps {
  item: LibraryItem;
  library: Library | undefined;
  onBack: () => void;
  onDelete: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "flashcards", label: "Flashcards" },
  { id: "citations", label: "Citations" },
  { id: "content", label: "Content" },
];

function typeLabel(type: string) {
  if (type === "markdown") return "Markdown";
  if (type === "text") return "Text";
  if (type === "image") return "Image";
  if (type === "pdf") return "PDF";
  return "File";
}

function formatDate(ts: number) {
  const now = Date.now();
  const days = Math.floor((now - ts) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatReviewDate(ts: number) {
  const days = Math.ceil((ts - Date.now()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days}d`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 flex flex-col gap-0.5 px-4 py-3 rounded-xl border border-[#E4E3E1] bg-white min-w-0">
      <span className="text-2xl font-bold text-[#0C0C0C] leading-none">{value}</span>
      <span className="text-[11px] text-[#A8A5A0] leading-snug">{label}</span>
    </div>
  );
}

function BookCover({ item, library }: { item: LibraryItem; library?: Library }) {
  const color = library?.color ?? "#A8A5A0";
  const hasThumbnail = item.type === "pdf" && Boolean(item.metadata.thumbnail);

  return (
    <div
      className="relative rounded-[4px] overflow-hidden shrink-0"
      style={{
        width: 140,
        height: 200,
        backgroundColor: `color-mix(in oklch, black 45%, ${color})`,
      }}
    >
      {hasThumbnail && (
        <Image
          src={item.metadata.thumbnail!}
          alt={item.title}
          fill
          unoptimized
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div
        className="absolute inset-y-0 left-0 w-[4px]"
        style={{ backgroundColor: `color-mix(in oklch, black 65%, ${color})` }}
      />
      <span className="absolute top-2 right-2 text-[7px] font-bold text-white/50 uppercase tracking-wider">
        {typeLabel(item.type)}
      </span>
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6">
        <p className="text-[11px] font-bold text-white leading-snug line-clamp-3">
          {item.title}
        </p>
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

const GENERATE_TILES = [
  { icon: Layers, label: "Flashcards", mode: "flashcards" as const, disabled: false },
  { icon: BrainCircuit, label: "Quiz", mode: "quiz" as const, disabled: true },
  { icon: Zap, label: "Sprint", mode: "sprint" as const, disabled: true },
  { icon: Link2, label: "Connections", mode: "connections" as const, disabled: true },
] as const;

function OverviewTab({ item, library }: { item: LibraryItem; library?: Library }) {
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [citationCount, setCitationCount] = useState(0);
  const [nextReview, setNextReview] = useState<number | null>(null);
  const openGeneration = useGenerationStore((s) => s.open);

  useEffect(() => {
    Promise.all([
      StorageService.listExercisesBySourceItem(item.id),
      StorageService.listMessagesCitingItem(item.id),
      StorageService.getNextSRSReviewForItem(item.id),
    ]).then(([exs, pairs, nextReview]) => {
      setFlashcardCount(exs.reduce((sum, e) => {
        if (e.type === "flashcard") {
          return sum + ((e.data as { cards: unknown[] }).cards?.length ?? 0);
        }
        return sum;
      }, 0));
      setCitationCount(pairs.reduce(
        (sum, { message }) =>
          sum + (message.citations?.filter((c) => c.libraryItemId === item.id).length ?? 0),
        0
      ));
      setNextReview(nextReview);
    });
  }, [item.id]);

  return (
    <div className="flex gap-6 items-start">
      <BookCover item={item} library={library} />

      <div className="flex-1 flex flex-col gap-5 min-w-0">
        {/* Stats */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-[#A8A5A0] tracking-[2px] uppercase">
            Activity
          </span>
          <div className="flex gap-2.5">
            <StatCard value={String(flashcardCount)} label="Flashcards generated" />
            <StatCard value={String(citationCount)} label="Times cited in chat" />
            <StatCard
              value={nextReview ? formatReviewDate(nextReview) : "—"}
              label="Next SRS review"
            />
          </div>
        </div>

        {/* Generate row */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-[#A8A5A0] tracking-[2px] uppercase">
            Generate
          </span>
          <div className="flex gap-2">
            {GENERATE_TILES.map(({ icon: Icon, label, mode, disabled }) => (
              <motion.button
                key={mode}
                whileHover={disabled ? undefined : { y: -1 }}
                whileTap={disabled ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                disabled={disabled}
                onClick={disabled ? undefined : () => openGeneration(item.id, item.title, mode)}
                title={disabled ? "Coming soon" : label}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[12px] font-medium transition-colors cursor-pointer ${
                  disabled
                    ? "opacity-40 cursor-not-allowed border-[#E4E3E1] bg-[#F8F8F7] text-[#A8A5A0]"
                    : "border-[#E4E3E1] bg-[#F8F8F7] text-[#3D3B38] hover:bg-[#F1F0EF] hover:border-[#D3D1CE]"
                }`}
              >
                <Icon size={14} />
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Citations Tab ──────────────────────────────────────────────────────────────

function CitationsTab({ item, library }: { item: LibraryItem; library?: Library }) {
  const [entries, setEntries] = useState<CitationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveView } = useAppStore();
  const { setActiveConversationId } = useChatStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const pairs = await StorageService.listMessagesCitingItem(item.id);

      if (cancelled) return;

      if (pairs.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const convIds = [...new Set(pairs.map((p) => p.message.conversationId))];
      const convMsgsEntries = await Promise.all(
        convIds.map(async (id) => [id, await StorageService.getMessages(id)] as const)
      );
      const convMsgsMap = new Map(convMsgsEntries);

      if (cancelled) return;

      const all: CitationEntry[] = [];
      for (const { message, conversation } of pairs) {
        const msgs = convMsgsMap.get(message.conversationId) ?? [];
        const msgIdx = msgs.findIndex((m) => m.id === message.id);
        const userMsg =
          msgIdx > 0
            ? msgs
                .slice(0, msgIdx)
                .reverse()
                .find((m) => m.role === "user") ?? null
            : null;

        const cits = (message.citations ?? []).filter(
          (c) => c.libraryItemId === item.id
        );
        for (const citation of cits) {
          all.push({ citation, userQuestion: userMsg?.content ?? null, conversation });
        }
      }

      setEntries(all);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [item.id]);

  const goToConversation = (conversationId: string | undefined) => {
    if (!conversationId) return;
    setActiveConversationId(conversationId);
    setActiveView("chat");
  };

  const accentColor = library?.color ?? "#34D399";

  if (loading) {
    return (
      <p className="text-sm text-[#A8A5A0] py-12 text-center">Loading citations…</p>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F8F8F7] border border-[#E4E3E1] flex items-center justify-center mb-3">
          <MessageSquare size={20} className="text-[#A8A5A0]" />
        </div>
        <p className="text-sm text-[#7C7974]">No citations yet</p>
        <p className="text-xs text-[#A8A5A0] mt-1">
          Start a chat with this document to generate citations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <p className="text-[15px] font-semibold text-[#0C0C0C]">
          {entries.length} citation{entries.length !== 1 ? "s" : ""} from this document
        </p>
        <p className="text-xs text-[#A8A5A0] mt-0.5">
          Excerpts used by the AI in conversations
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-xl border border-[#E4E3E1] overflow-hidden bg-white"
          >
            {/* User question row */}
            {entry.userQuestion && (
              <>
                <button
                  onClick={() => goToConversation(entry.conversation?.id)}
                  className="w-full flex items-start gap-2.5 px-4 py-3.5 hover:bg-[#F8F8F7] transition-colors text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#F1F0EF] flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7C7974"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <p className="flex-1 min-w-0 text-[13px] text-[#3D3B38] leading-relaxed line-clamp-2">
                    {entry.userQuestion}
                  </p>
                  <ExternalLink
                    size={13}
                    className="text-[#C8C5C0] group-hover:text-[#7C7974] transition-colors shrink-0 mt-1"
                  />
                </button>
                <div className="h-px bg-[#F1F0EF]" />
              </>
            )}

            {/* Excerpt */}
            <div className="flex items-start gap-3 px-4 py-3.5 bg-[#FAFAFA]">
              <div
                className="w-[3px] rounded-sm shrink-0 self-stretch"
                style={{ backgroundColor: accentColor, minHeight: 40 }}
              />
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[11px] font-semibold text-[#5C5A56]">
                  {entry.citation.itemTitle}
                  {entry.citation.page ? ` — p. ${entry.citation.page}` : ""}
                </span>
                <p className="text-[12px] text-[#7C7974] leading-relaxed">
                  &ldquo;{entry.citation.excerpt}&rdquo;
                </p>
              </div>
            </div>

            {/* Fallback link when no user question */}
            {!entry.userQuestion && entry.conversation && (
              <button
                onClick={() => goToConversation(entry.conversation?.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-[#F1F0EF] hover:bg-[#F8F8F7] transition-colors text-left cursor-pointer"
              >
                <MessageSquare size={12} className="text-[#A8A5A0]" />
                <span className="flex-1 min-w-0 text-xs text-[#A8A5A0] truncate">
                  {entry.conversation.title}
                </span>
                <ExternalLink size={12} className="text-[#C8C5C0] shrink-0" />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DocumentDetailPage({
  item,
  library,
  onBack,
  onDelete,
}: DocumentDetailPageProps) {
  const [tab, setTab] = useState<Tab>("overview");

  const wordCount =
    item.metadata.wordCount ?? item.content.split(/\s+/).filter(Boolean).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="flex flex-col h-full w-full bg-white"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-[#7C7974] hover:text-[#3D3B38] cursor-pointer -ml-2 gap-1.5"
          >
            <ArrowLeft size={16} />
            Back to Library
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[#A8A5A0] hover:text-[#3D3B38] cursor-pointer"
              >
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <FolderInput size={14} className="mr-2" />
                Move to library
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Pencil size={14} className="mr-2" />
                Edit metadata
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={onDelete}
              >
                <Trash2 size={14} className="mr-2" />
                Delete item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Header */}
        <div className="px-8 pb-4 border-b border-[#E4E3E1]">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#0C0C0C] mb-2.5 leading-[1.3]">
            {item.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {library && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: `${library.color}18`,
                  color: library.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: library.color }}
                />
                {library.name}
              </span>
            )}
            <span className="text-xs text-[#A8A5A0]">·</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[#F1F0EF] text-[#5C5A56]">
              {typeLabel(item.type)}
            </span>
            {item.type !== "image" && (
              <>
                <span className="text-xs text-[#A8A5A0]">·</span>
                <span className="text-xs text-[#7C7974]">
                  {wordCount.toLocaleString()} words
                </span>
              </>
            )}
            <span className="text-xs text-[#A8A5A0]">·</span>
            <span className="text-xs text-[#7C7974]">{formatDate(item.createdAt)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-end gap-0.5 px-7 border-b border-[#E4E3E1]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-3 py-2.5 text-[13px] font-medium cursor-pointer transition-colors ${
                tab === t.id
                  ? "text-[#0C0C0C]"
                  : "text-[#A8A5A0] hover:text-[#5C5A56]"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0C0C0C] rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto px-8 py-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
            >
              {tab === "overview" && (
                <OverviewTab item={item} library={library} />
              )}

              {tab === "flashcards" && (
                <StudyHistory documentId={item.id} />
              )}

              {tab === "citations" && (
                <CitationsTab item={item} library={library} />
              )}

              {tab === "content" && (
                <>
                  {item.type === "image" ? (
                    <div className="flex items-center justify-center py-12">
                      <Image
                        src={item.content}
                        alt={item.title}
                        width={item.metadata.dimensions?.width ?? 800}
                        height={item.metadata.dimensions?.height ?? 600}
                        unoptimized
                        className="max-h-[60vh] w-auto object-contain rounded-lg"
                      />
                    </div>
                  ) : item.content ? (
                    <ContentPreview
                      content={item.content}
                      libraryColor={library?.color ?? "#A8A5A0"}
                    />
                  ) : (
                    <p className="text-sm text-[#A8A5A0] text-center py-12">
                      No text content available.
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <GenerationModal item={item} />
    </>
  );
}
