"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import {
  FileText,
  Upload,
  Link,
  Camera,
  ArrowLeft,
} from "lucide-react";
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

type Step = "options" | "paste" | "upload";

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
}

const OPTIONS = [
  {
    id: "paste" as const,
    icon: FileText,
    color: "#34D399",
    bg: "#ECFDF5",
    title: "Paste Text",
    description: "Paste notes, sources, or any written content",
    enabled: true,
  },
  {
    id: "upload" as const,
    icon: Upload,
    color: "#60A5FA",
    bg: "#EFF6FF",
    title: "Upload File",
    description: "PDF, TXT, or Markdown files",
    enabled: true,
  },
  {
    id: "url" as const,
    icon: Link,
    color: "#A78BFA",
    bg: "#F5F3FF",
    title: "Import from URL",
    description: "Fetch content from a web page or article",
    enabled: false,
  },
  {
    id: "scan" as const,
    icon: Camera,
    color: "#FBBF24",
    bg: "#FFFBEB",
    title: "Scan Photo",
    description: "Extract text from an image or photo",
    enabled: false,
  },
];

export default function AddContentModal({
  open,
  onOpenChange,
  activeLibraryId,
  isMutating,
  onAddNote,
  onAddFiles,
}: AddContentModalProps) {
  const [step, setStep] = useState<Step>("options");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"text" | "markdown">("text");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  const reset = () => {
    setStep("options");
    setNoteTitle("");
    setNoteContent("");
    setNoteType("text");
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== "options" && (
              <button
                onClick={() => setStep("options")}
                className="cursor-pointer text-[#999] hover:text-[#333] transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            {step === "options" && "Add Content"}
            {step === "paste" && "Paste Text"}
            {step === "upload" && "Upload File"}
          </DialogTitle>
          {step === "options" && (
            <p className="text-sm text-[#888] font-normal">
              Add new content to your library from various sources.
            </p>
          )}
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "options" && (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {OPTIONS.map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <motion.button
                    key={opt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    disabled={!opt.enabled}
                    onClick={() => opt.enabled && setStep(opt.id as Step)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors text-left ${
                      opt.enabled
                        ? "border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer"
                        : "border-[#F1F1F1] opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: opt.bg }}
                    >
                      <Icon size={18} style={{ color: opt.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {opt.title}
                        </span>
                        {!opt.enabled && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF] font-medium">
                            Coming Soon
                          </span>
                        )}
                      </div>
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
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
              <div>
                <Label>Content</Label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Paste your text or markdown here..."
                  className="mt-1 w-full min-h-36 rounded-md border border-[#DDD] bg-white px-3 py-2 text-sm outline-none focus:border-[#999] transition-colors resize-y"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer border transition-colors ${
                    noteType === "text"
                      ? "bg-[#111] text-white border-[#111]"
                      : "bg-white text-[#555] border-[#DDD] hover:border-[#BBB]"
                  }`}
                  onClick={() => setNoteType("text")}
                >
                  Text
                </button>
                <button
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer border transition-colors ${
                    noteType === "markdown"
                      ? "bg-[#111] text-white border-[#111]"
                      : "bg-white text-[#555] border-[#DDD] hover:border-[#BBB]"
                  }`}
                  onClick={() => setNoteType("markdown")}
                >
                  Markdown
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  onClick={handleSaveNote}
                  disabled={!noteContent.trim() || isMutating}
                  className="cursor-pointer"
                >
                  Save
                </Button>
              </div>
            </motion.div>
          )}

          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  dragOver
                    ? "border-[#60A5FA] bg-[#EFF6FF]"
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
                    <Upload size={24} className="text-[#999]" />
                    <p className="text-sm text-[#666]">
                      Drag & drop files here or{" "}
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
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
