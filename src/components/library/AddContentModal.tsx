"use client";

import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { FileText, Upload, PenLine, ArrowLeft, Clipboard, RotateCcw, Folder } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Step = "options" | "paste" | "upload" | "new-markdown";

interface AddContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeLibraryId: string | null;
  isMutating: boolean;
  onAddNote: (data: {
    title: string;
    content: string;
    type: "text" | "markdown";
  }) => Promise<void>;
  onAddFiles: (files: File[]) => Promise<void>;
  onCreateMarkdown: (title: string) => Promise<void>;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const STEP_SPRING = { type: "spring", stiffness: 280, damping: 32, opacity: { duration: 0.15, ease: "easeOut" } } as const;

const OPTIONS = [
  {
    id: "paste" as const,
    icon: FileText,
    color: "#10B981",
    bg: "#F0FDF4",
    title: "Paste Text",
    description: "Paste notes, sources, or any written content",
  },
  {
    id: "upload" as const,
    icon: Upload,
    color: "#3B82F6",
    bg: "#EFF6FF",
    title: "Upload File",
    description: "PDF, TXT, or Markdown files",
  },
  {
    id: "new-markdown" as const,
    icon: PenLine,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    title: "New Markdown",
    description: "Create a blank document and open the editor",
  },
];

function looksLikeMarkdown(text: string) {
  return /^#{1,6}\s|\*\*[^*]+\*\*|^[-*+]\s|^```|^\[.+\]\(.+\)/m.test(text);
}

function contentStats(text: string) {
  const lines = text.split("\n").length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return { lines, words };
}

export default function AddContentModal({
  open,
  onOpenChange,
  activeLibraryId,
  isMutating,
  onAddNote,
  onAddFiles,
  onCreateMarkdown,
}: AddContentModalProps) {
  const [step, setStep] = useState<Step>("options");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isFirstOptions, setIsFirstOptions] = useState(true);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"text" | "markdown">("text");
  const [mdTitle, setMdTitle] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  // Global paste listener when paste step is active
  useEffect(() => {
    if (step !== "paste" || !open) return;

    const handler = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (!text?.trim()) return;
      setNoteContent(text);
      if (looksLikeMarkdown(text)) setNoteType("markdown");
    };

    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [step, open]);

  const goToStep = (next: Exclude<Step, "options">) => {
    setDirection("forward");
    setStep(next);
  };

  const goBack = () => {
    setDirection("back");
    setIsFirstOptions(false);
    setStep("options");
  };

  const reset = () => {
    setStep("options");
    setIsFirstOptions(true);
    setNoteTitle("");
    setNoteContent("");
    setNoteType("text");
    setMdTitle("");
    setUploadingFiles([]);
    setDragOver(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    await onAddNote({ title: noteTitle, content: noteContent, type: noteType });
    reset();
    onOpenChange(false);
  };

  const handleCreateMarkdown = async () => {
    await onCreateMarkdown(mdTitle);
    reset();
    onOpenChange(false);
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingFiles(files);
    await onAddFiles(files);
    reset();
    onOpenChange(false);
  };

  const handleFilesPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    processFiles(files);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  if (!activeLibraryId) return null;

  const stepTitle = {
    options: "Add Content",
    paste: "Paste Text",
    upload: "Upload File",
    "new-markdown": "Creating a new markdown note",
  }[step];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        {/* Inner wrapper owns the padding + clipping context */}
        <div className="relative overflow-hidden rounded-lg p-6 flex flex-col gap-4">
          {/* Dotted grid background — only when creating markdown */}
          <AnimatePresence>
            {step === "new-markdown" && (
              <motion.div
                key="dots-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #C8C8C8 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>

          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2">
              {step !== "options" && (
                <button
                  onClick={goBack}
                  className="cursor-pointer text-[#999] hover:text-[#333] transition-colors active:scale-95"
                >
                  <ArrowLeft size={17} />
                </button>
              )}
              {stepTitle}
            </DialogTitle>
            {step === "options" && (
              <p className="text-sm text-[#888] font-normal">
                Choose how to add content to your library.
              </p>
            )}
          </DialogHeader>

          <div className="overflow-hidden relative">
        <AnimatePresence mode="popLayout">
          {step === "options" && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: direction === "back" ? -24 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === "forward" ? -20 : 0 }}
              transition={STEP_SPRING}
              className="space-y-1.5"
            >
              {OPTIONS.map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <motion.button
                    key={opt.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{
                      delay: isFirstOptions ? i * 0.04 : 0,
                      duration: 0.18,
                      ease: EASE_OUT,
                      scale: { duration: 0.12, ease: "easeOut" },
                    }}
                    onClick={() => goToStep(opt.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer text-left transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: opt.bg }}
                    >
                      <Icon size={17} style={{ color: opt.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {opt.title}
                      </p>
                      <p className="text-xs text-[#888] mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {step === "paste" && (
            <motion.div
              key="paste"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={STEP_SPRING}
              className="space-y-3"
            >
              <div>
                <Label>Title</Label>
                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title (optional)"
                  className="mt-1"
                />
              </div>

              {/* Paste zone */}
              <AnimatePresence mode="wait">
                {!noteContent ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: EASE_OUT }}
                    className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed border-[#E0E0E0] bg-[#FAFAFA] select-none"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-center shadow-sm">
                      <Clipboard size={18} className="text-[#666]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[#333]">
                        Press{" "}
                        <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-[#D0D0D0] text-[11px] font-mono text-[#444] shadow-[0_1px_0_#ccc]">
                          ⌘V
                        </kbd>{" "}
                        to paste
                      </p>
                      <p className="text-xs text-[#AAA] mt-1">
                        Content will appear here automatically
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="filled"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: EASE_OUT }}
                    className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] overflow-hidden"
                  >
                    {/* Stats bar */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#EFEFEF] bg-white">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#555] font-medium">
                          {contentStats(noteContent).lines}{" "}
                          <span className="text-[#AAA] font-normal">lines</span>
                        </span>
                        <span className="text-[#DDD]">·</span>
                        <span className="text-xs text-[#555] font-medium">
                          {contentStats(noteContent).words}{" "}
                          <span className="text-[#AAA] font-normal">words</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setNoteContent("");
                            setNoteType("text");
                          }}
                          className="flex items-center gap-1 text-[11px] text-[#999] hover:text-[#555] transition-colors cursor-pointer"
                        >
                          <RotateCcw size={11} />
                          Paste again
                        </button>
                        <Button
                          onClick={handleSaveNote}
                          disabled={isMutating}
                          size="sm"
                          className="cursor-pointer h-6 text-xs px-2.5"
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="relative px-3 py-2.5 max-h-36 overflow-hidden">
                      <pre className="text-xs text-[#555] font-mono whitespace-pre-wrap break-all leading-relaxed">
                        {noteContent.slice(0, 600)}
                        {noteContent.length > 600 && "…"}
                      </pre>
                      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#FAFAFA] to-transparent pointer-events-none" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={STEP_SPRING}
              className="space-y-3"
            >
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  dragOver
                    ? "border-[#3B82F6] bg-[#EFF6FF]"
                    : "border-[#DDD] hover:border-[#BBB] bg-[#FAFAFA]"
                }`}
              >
                {uploadingFiles.length > 0 ? (
                  <>
                    <div className="w-8 h-8 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[#666]">
                      Processing {uploadingFiles.length} file
                      {uploadingFiles.length > 1 ? "s" : ""}...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={22} className="text-[#999]" />
                    <p className="text-sm text-[#666]">
                      Drag & drop or{" "}
                      <span className="text-[#111] font-medium underline">
                        browse
                      </span>
                    </p>
                    <p className="text-xs text-[#AAA]">
                      PDF, TXT, Markdown, or images
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".md,.markdown,.txt,.pdf,image/*"
                onChange={handleFilesPicked}
              />
            </motion.div>
          )}

          {step === "new-markdown" && (
            <motion.div
              key="new-markdown"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={STEP_SPRING}
            >
              {/* macOS window mock */}
              <div className="relative" style={{ height: 268 }}>
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: 0.08,
                    duration: 0.28,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className="absolute overflow-hidden rounded-xl"
                  style={{
                    inset: "20px 0px 20px 16px",
                    background: "white",
                    boxShadow:
                      "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Title bar */}
                  <div
                    className="flex items-center gap-3 px-4"
                    style={{
                      height: 52,
                      background: "#ECECEC",
                      borderBottom: "1px solid #D8D8D8",
                    }}
                  >
                    {/* Traffic lights */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#FF5F57" }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#FEBC2E" }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#28C840" }}
                      />
                    </div>

                    {/* Folder + editable title */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Folder size={20} className="text-[#777] shrink-0" />
                      <input
                        value={mdTitle}
                        onChange={(e) => setMdTitle(e.target.value)}
                        placeholder="New Markdown"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCreateMarkdown()
                        }
                        autoFocus
                        className="flex-1 min-w-0 bg-transparent border-none outline-none font-bold text-[#1A1A1A] placeholder:text-[#AAAAAA] caret-[#333] truncate"
                        style={{ fontSize: 22 }}
                      />
                    </div>
                  </div>

                  {/* Window body */}
                  <div
                    className="w-full"
                    style={{
                      height: "calc(100% - 52px)",
                      background: "white",
                    }}
                  />
                </motion.div>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-3">
                <Button
                  onClick={handleCreateMarkdown}
                  disabled={isMutating}
                  className="cursor-pointer"
                >
                  Create
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
