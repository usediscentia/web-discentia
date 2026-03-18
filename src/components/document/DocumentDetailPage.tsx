"use client";

import { ArrowLeft, MoreHorizontal, Trash2, FolderInput, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LibraryItem, Library } from "@/types/library";
import DocumentPreview from "./DocumentPreview";
import GenerateExercisesCard from "./GenerateExercisesCard";
import ContentPreview from "./ContentPreview";
import StudyHistory from "./StudyHistory";
import GenerationModal from "@/components/generation/GenerationModal";

interface DocumentDetailPageProps {
  item: LibraryItem;
  library: Library | undefined;
  onBack: () => void;
  onDelete: () => void;
}

function formatDate(ts: number) {
  const now = Date.now();
  const diff = now - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function typeLabel(type: string) {
  if (type === "markdown") return "Markdown";
  if (type === "text") return "Text";
  if (type === "image") return "Image";
  if (type === "pdf") return "PDF";
  return "File";
}

export default function DocumentDetailPage({
  item,
  library,
  onBack,
  onDelete,
}: DocumentDetailPageProps) {
  const wordCount =
    item.metadata.wordCount ?? item.content.split(/\s+/).filter(Boolean).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col h-full w-full bg-[#FAFAFA]"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-6 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-[#7C7974] hover:text-[#3D3B38] cursor-pointer -ml-2"
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto px-8 pb-12">
          {/* Header block */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#0C0C0C] mb-3">
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
              <span className="text-xs text-[#A8A5A0]">·</span>
              <span className="text-xs text-[#7C7974]">
                {wordCount.toLocaleString()} words
              </span>
              <span className="text-xs text-[#A8A5A0]">·</span>
              <span className="text-xs text-[#7C7974]">
                {formatDate(item.createdAt)}
              </span>
            </div>
          </div>

          {/* Hero section — two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 mb-8">
            {/* Left: preview */}
            <DocumentPreview item={item} />

            {/* Right: generate exercises */}
            <GenerateExercisesCard
              documentId={item.id}
              documentTitle={item.title}
            />
          </div>

          {/* Content preview */}
          {item.type !== "image" && item.content && (
            <div className="mb-8">
              <ContentPreview
                content={item.content}
                libraryColor={library?.color || "#A8A5A0"}
              />
            </div>
          )}

          {/* Study history */}
          <StudyHistory />
        </div>
      </motion.div>

      {/* Generation modal */}
      <GenerationModal item={item} />
    </>
  );
}
