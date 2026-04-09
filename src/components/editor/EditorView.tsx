"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Plus,
  ChevronDown,
  Loader2,
  BookOpen,
  HelpCircle,
  Sparkles,
  Check,
  X,
  CloudUpload,
  NotebookPen,
  Library as LibraryIcon,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAppStore } from "@/stores/app.store";
import { useChatStore } from "@/stores/chat.store";
import { StorageService } from "@/services/storage";
import MarkdownEditor from "./MarkdownEditor";
import { useEditorAutosave } from "./useEditorAutosave";
import type { Library } from "@/types/library";
import { LIBRARY_COLORS } from "@/lib/colors";


function stripMarkdown(md: string): string {
  return md.replace(/[#*_~`>\-|]/g, " ").replace(/\s+/g, " ");
}

function countWords(md: string): number {
  return stripMarkdown(md).trim().split(/\s+/).filter(Boolean).length;
}

function countChars(md: string): number {
  return stripMarkdown(md).trim().length;
}

// --- Save Toast ---
interface SaveToastProps {
  title: string;
  libraryName: string;
  libraryColor: string;
  visible: boolean;
  onDismiss: () => void;
}

function SaveToast({
  title,
  libraryName,
  libraryColor,
  visible,
  onDismiss,
}: SaveToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl px-5 py-3 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1),0_2px_6px_-2px_rgba(0,0,0,0.05)]"
        >
          <div className="w-7 h-7 rounded-full bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-emerald-500" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-[#111827]">
              Saved successfully
            </span>
            <div className="flex items-center gap-1.5 text-[13px]">
              <span className="font-semibold text-[var(--brand)]">
                {title || "Untitled"}
              </span>
              <span className="text-[#9CA3AF]">&rarr;</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: libraryColor }}
                />
                {libraryName}
              </span>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer ml-1 transition-colors"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Library Selector Popover ---
interface LibrarySelectorProps {
  libraries: Library[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLibraryCreated: (lib: Library) => void;
}

function LibrarySelector({ libraries, selectedId, onSelect, onLibraryCreated }: LibrarySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(LIBRARY_COLORS[0].hex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const selected = libraries.find((l) => l.id === selectedId);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setCreating(false);
    setNewName("");
    setNewColor(LIBRARY_COLORS[0].hex);
    // Load item counts when popover opens
    Promise.all(
      libraries.map((lib) =>
        StorageService.listLibraryItems(lib.id).then((items) => ({
          id: lib.id,
          count: items.length,
        }))
      )
    ).then((results) => {
      const counts: Record<string, number> = {};
      for (const r of results) counts[r.id] = r.count;
      setItemCounts(counts);
    });
  }, [open, libraries]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const filtered = libraries.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (creating) nameInputRef.current?.focus();
  }, [creating]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const lib = await StorageService.createLibrary({ name: trimmed, color: newColor });
      onLibraryCreated(lib);
      onSelect(lib.id);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={popoverRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--brand-ring)] bg-[var(--brand-soft)] py-[6px] pl-3 pr-2.5 text-[13px] font-medium text-[var(--brand)] transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
      >
        <LibraryIcon size={14} className="text-[var(--brand)]" />
        {selected && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: selected.color }}
          />
        )}
        <span>{selected?.name || "Select library"}</span>
        <ChevronDown
          size={12}
          className={`text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-[280px] bg-white rounded-xl border border-[#E5E7EB] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1),0_2px_8px_-2px_rgba(0,0,0,0.04)] z-20 overflow-hidden"
          >
            {/* Header + Search */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-[#F3F4F6]">
              <p className="text-[13px] font-semibold text-[#374151] mb-2.5">
                Save to library
              </p>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                <Search size={14} className="text-[#9CA3AF] flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search libraries..."
                  className="text-[13px] bg-transparent outline-none w-full text-[#374151] placeholder:text-[#9CA3AF]"
                  autoFocus
                />
              </div>
            </div>

            {/* Library list */}
            <div className="p-1.5 max-h-[240px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-[13px] text-[#9CA3AF] text-center py-4">
                  No libraries found
                </p>
              ) : (
                filtered.map((lib) => {
                  const isSelected = lib.id === selectedId;
                  return (
                    <button
                      key={lib.id}
                      onClick={() => {
                        onSelect(lib.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[var(--brand-soft)]"
                          : "hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <span
                        className="w-1 h-8 rounded-sm flex-shrink-0"
                        style={{ background: lib.color }}
                      />
                      <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                        <span
                          className={`text-sm truncate ${
                            isSelected
                              ? "font-semibold text-[var(--brand)]"
                              : "font-medium text-[#374151]"
                          }`}
                        >
                          {lib.name}
                        </span>
                        <span
                          className={`text-xs ${
                            isSelected ? "text-[#6B7280]" : "text-[#9CA3AF]"
                          }`}
                        >
                          {itemCounts[lib.id] ?? "..."} items
                        </span>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-[var(--brand)] flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-1.5 border-t border-[#F3F4F6]">
              {creating ? (
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate();
                        if (e.key === "Escape") setCreating(false);
                      }}
                      placeholder="Library name"
                      className="flex-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1.5 text-[13px] text-[#374151] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand-ring)]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    {LIBRARY_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setNewColor(c.hex)}
                        className={`w-5 h-5 rounded-full cursor-pointer transition-all ${
                          newColor === c.hex
                            ? "ring-2 ring-offset-1 ring-[var(--brand)] scale-110"
                            : "hover:scale-110"
                        }`}
                        style={{ background: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCreating(false)}
                      className="flex-1 text-[13px] font-medium text-[#6B7280] py-1.5 rounded-lg border border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newName.trim() || isSubmitting}
                      className="flex-1 cursor-pointer rounded-lg bg-primary py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                >
                  <Plus size={14} className="text-[#9CA3AF]" />
                  Create new library
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Empty State Overlay ---
function EditorEmptyState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[1]">
      <NotebookPen size={48} className="text-[#D1D5DB] mb-3" />
      <p className="text-base font-medium text-[#9CA3AF]">
        Start writing your notes...
      </p>
      <p className="text-[13px] text-[#D1D5DB] mt-1.5">
        Your note will auto-save as you type
      </p>
      <div className="flex items-center gap-1.5 mt-2 text-xs text-[#D1D5DB]">
        <span>or press</span>
        <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-[#9CA3AF] bg-[#F3F4F6] border border-[#E5E7EB] rounded">
          ⌘S
        </kbd>
        <span>to save manually</span>
      </div>
    </div>
  );
}

// --- Main EditorView ---
export default function EditorView() {
  const { editorItemId, setEditorItemId, setActiveView } = useAppStore();
  const { setPendingMessage, setSelectedLibraryIds } = useChatStore();

  const [title, setTitle] = useState("");
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [initialContent, setInitialContent] = useState<string | undefined>(
    undefined
  );
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [editorMarkdown, setEditorMarkdown] = useState<string>("");
  const [contentReady, setContentReady] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastInfo, setToastInfo] = useState({
    title: "",
    libraryName: "",
    libraryColor: "",
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  const hasContent = Boolean(editorMarkdown && editorMarkdown.trim().length > 0);

  useEffect(() => {
    StorageService.listLibraries().then(setLibraries);
  }, []);

  useEffect(() => {
    if (!libraryId && libraries.length > 0) {
      const timeout = window.setTimeout(() => setLibraryId(libraries[0].id), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [libraries, libraryId]);

  const handleItemCreated = useCallback(
    (id: string) => {
      setEditorItemId(id);
    },
    [setEditorItemId]
  );

  const {
    triggerSave,
    saveNow,
    isSaving,
    lastSavedAt,
    reset: resetAutosave,
  } = useEditorAutosave({
    itemId: editorItemId,
    libraryId,
    title,
    onItemCreated: handleItemCreated,
  });

  const showSaveToast = useCallback(() => {
    const lib = libraries.find((l) => l.id === libraryId);
    setToastInfo({
      title: title || "Untitled",
      libraryName: lib?.name || "Library",
      libraryColor: lib?.color || "var(--brand)",
    });
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000);
  }, [libraries, libraryId, title]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!editorItemId) {
      const timeout = window.setTimeout(() => {
        if (!cancelled) setContentReady(true);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timeout);
      };
    }

    const loadingTimeout = window.setTimeout(() => {
      if (!cancelled) setContentReady(false);
    }, 0);
    StorageService.getLibraryItem(editorItemId).then((item) => {
      if (cancelled) return;
      if (!item) {
        setContentReady(true);
        return;
      }
      setTitle(item.title);
      setLibraryId(item.libraryId);
      setInitialContent(item.content);
      setContentReady(true);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimeout);
    };
  }, [editorItemId]);

  const handleUpdate = useCallback(
    (markdown: string) => {
      setEditorMarkdown(markdown);
      setWordCount(countWords(markdown));
      setCharCount(countChars(markdown));
      triggerSave(markdown);
    },
    [triggerSave]
  );

  useEffect(() => {
    if (editorMarkdown && title) {
      triggerSave(editorMarkdown);
    }
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveNow().then(() => showSaveToast());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveNow, showSaveToast]);

  const handleNewNote = useCallback(() => {
    setEditorItemId(null);
    setTitle("");
    setInitialContent("");
    setEditorMarkdown("");
    setWordCount(0);
    setCharCount(0);
    setToastVisible(false);
    resetAutosave();
  }, [setEditorItemId, resetAutosave]);

  const handleAIAction = useCallback(
    (type: "flashcards" | "quiz") => {
      if (!hasContent) return;

      const labels = {
        flashcards: "flashcards",
        quiz: "a quiz",
      };
      const prompt = `Create ${labels[type]} about the following content:\n\n${editorMarkdown}`;

      setPendingMessage(prompt);
      if (libraryId) {
        setSelectedLibraryIds([libraryId]);
      }
      setActiveView("chat");
    },
    [
      hasContent,
      editorMarkdown,
      libraryId,
      setPendingMessage,
      setSelectedLibraryIds,
      setActiveView,
    ]
  );

  const [statusNow, setStatusNow] = useState(() => Date.now());

  const saveStatusText = useMemo(() => {
    if (isSaving) return null;
    if (lastSavedAt) {
      const seconds = Math.floor((statusNow - lastSavedAt) / 1000);
      if (seconds < 5) return "Saved";
      if (seconds < 60) return `Saved ${seconds}s ago`;
      return `Saved ${Math.floor(seconds / 60)}m ago`;
    }
    return null;
  }, [isSaving, lastSavedAt, statusNow]);

  useEffect(() => {
    if (!lastSavedAt) return;
    const initialTimeout = window.setTimeout(() => setStatusNow(Date.now()), 0);
    const interval = setInterval(() => setStatusNow(Date.now()), 10000);
    return () => {
      window.clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [lastSavedAt]);

  if (!contentReady) {
    return (
      <div className="flex items-center justify-center h-full text-[#9CA3AF] text-sm">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div ref={editorRef} className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-14 px-8 border-b border-[#E5E7EB] bg-white flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <FileText size={20} className="text-primary flex-shrink-0" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled note"
            className="text-base font-semibold text-[#171717] bg-transparent outline-none placeholder:text-[#C0C0C0] min-w-0"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <LibrarySelector
            libraries={libraries}
            selectedId={libraryId}
            onSelect={setLibraryId}
            onLibraryCreated={(lib) => setLibraries((prev) => [...prev, lib])}
          />

          <div className="w-px h-6 bg-[#E5E7EB]" />

          <button
            onClick={handleNewNote}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280] px-3 py-1.5 rounded-lg border border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
          >
            <Plus size={14} />
            New note
          </button>
        </div>
      </div>

      {/* Editor body — relative for toast + empty state overlays */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        <SaveToast
          title={toastInfo.title}
          libraryName={toastInfo.libraryName}
          libraryColor={toastInfo.libraryColor}
          visible={toastVisible}
          onDismiss={() => setToastVisible(false)}
        />
        {!hasContent && !editorItemId && <EditorEmptyState />}
        <MarkdownEditor
          initialContent={initialContent}
          onUpdate={handleUpdate}
          isEmpty={!hasContent}
        />
      </div>

      {/* Status bar */}
      <div className="h-10 px-8 border-t border-[#F3F4F6] bg-white flex items-center justify-between flex-shrink-0">
        <div
          className={`flex items-center gap-3 text-xs ${hasContent ? "text-[#9CA3AF]" : "text-[#D1D5DB]"}`}
        >
          <span>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <span
            className={`w-[3px] h-[3px] rounded-full ${hasContent ? "bg-[#D1D5DB]" : "bg-[#E5E7EB]"}`}
          />
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isSaving ? (
            <>
              <CloudUpload
                size={14}
                className="text-[#9CA3AF] animate-pulse"
              />
              <span className="text-[#9CA3AF]">Saving...</span>
            </>
          ) : saveStatusText ? (
            <>
              <Check size={14} className="text-emerald-500" />
              <span className="text-emerald-500 font-medium">
                {saveStatusText}
              </span>
            </>
          ) : !editorItemId ? (
            <span className="text-[#9CA3AF] italic">
              Not saved yet — start typing
            </span>
          ) : null}
        </div>
      </div>

      {/* AI Action Bar */}
      <div
        className={`h-14 px-8 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between flex-shrink-0 transition-opacity ${
          hasContent ? "opacity-100" : "opacity-50"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Sparkles size={18} className="text-primary" />
          <span className="text-sm font-medium text-[#374151]">
            Generate exercises from this note
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAIAction("flashcards")}
            disabled={!hasContent}
            className="flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F9FAFB] hover:border-[#D1D5DB] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <BookOpen size={14} />
            Flashcards
          </button>
          <button
            onClick={() => handleAIAction("quiz")}
            disabled={!hasContent}
            className="flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F9FAFB] hover:border-[#D1D5DB] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <HelpCircle size={14} />
            Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
