"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  FileType,
  File,
  Calendar,
  Hash,
  Layers,
  Trash2,
  Sparkles,
  BookOpen,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import type { LibraryItem } from "@/types/library";
import type { Library } from "@/types/library";

interface ItemDetailPanelProps {
  item: LibraryItem;
  library: Library | undefined;
  onBack: () => void;
  onDelete: () => void;
}

function typeIcon(type: string) {
  if (type === "markdown") return <FileText size={14} />;
  if (type === "text") return <FileText size={14} />;
  if (type === "image") return <ImageIcon size={14} />;
  if (type === "pdf") return <FileType size={14} />;
  return <File size={14} />;
}

function typeLabel(type: string) {
  if (type === "markdown") return "Markdown";
  if (type === "text") return "Text";
  if (type === "image") return "Image";
  if (type === "pdf") return "PDF";
  return "File";
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ItemDetailPanel({
  item,
  library,
  onBack,
  onDelete,
}: ItemDetailPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const wordCount = item.metadata.wordCount ?? item.content.split(/\s+/).filter(Boolean).length;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/10"
        onClick={onBack}
      />
      <motion.div
        key="panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white shadow-xl flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECEC]">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-[#666] hover:text-[#111] transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold text-[#1A1A1A] truncate max-w-md">
              {item.title}
            </h2>
            {library && (
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: `${library.color}18`,
                  color: library.color,
                }}
              >
                {library.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer text-xs">
              Edit
            </Button>
            <Button size="sm" className="cursor-pointer text-xs">
              <Sparkles size={14} className="mr-1" />
              Train with AI
            </Button>
          </div>
        </div>

        {/* Content + Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-auto p-6">
            {item.type === "image" ? (
              <div className="flex items-center justify-center h-full">
                <Image
                  src={item.content}
                  alt={item.title}
                  width={item.metadata.dimensions?.width || 1200}
                  height={item.metadata.dimensions?.height || 800}
                  unoptimized
                  className="max-h-[75vh] w-auto object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="max-w-2xl">
                <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">
                  {item.title}
                </h1>
                <pre className="whitespace-pre-wrap break-words text-sm text-[#333] leading-relaxed font-sans">
                  {item.content}
                </pre>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="w-56 border-l border-[#ECECEC] p-5 overflow-auto shrink-0">
            <h3 className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-3">
              Item Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#999]">{typeIcon(item.type)}</span>
                <span className="text-[#555]">Type</span>
                <span className="ml-auto text-[#1A1A1A] font-medium text-xs">
                  {typeLabel(item.type)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Layers size={14} className="text-[#999]" />
                <span className="text-[#555]">Library</span>
                {library && (
                  <span
                    className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${library.color}18`,
                      color: library.color,
                    }}
                  >
                    {library.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-[#999]" />
                <span className="text-[#555]">Added</span>
                <span className="ml-auto text-[#1A1A1A] text-xs">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              {item.type !== "image" && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash size={14} className="text-[#999]" />
                  <span className="text-[#555]">Words</span>
                  <span className="ml-auto text-[#1A1A1A] text-xs">
                    {wordCount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#555] rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors cursor-not-allowed opacity-60"
                >
                  <BookOpen size={14} />
                  Generate Flashcards
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#555] rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors cursor-not-allowed opacity-60"
                >
                  <Sparkles size={14} />
                  Create Quiz
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#555] rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors cursor-not-allowed opacity-60"
                >
                  <Zap size={14} />
                  Sprint Mode
                </button>
              </div>
            </div>

            <div className="mt-6">
              {confirmDelete ? (
                <div className="space-y-2">
                  <p className="text-xs text-[#666]">Delete this item permanently?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 cursor-pointer text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={onDelete}
                      className="flex-1 cursor-pointer text-xs bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-red-600 rounded-lg bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete Item
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
