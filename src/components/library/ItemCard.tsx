"use client";

import Image from "next/image";
import { FileText, ImageIcon, File, FileType, Trash2, PencilLine } from "lucide-react";
import { motion } from "motion/react";
import type { LibraryItem } from "@/types/library";

interface ItemCardProps {
  item: LibraryItem;
  libraryName: string;
  libraryColor: string;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  onOpenInEditor?: () => void;
}

function iconForType(type: string) {
  if (type === "markdown") return <FileText size={14} className="text-[#666]" />;
  if (type === "text") return <FileText size={14} className="text-[#666]" />;
  if (type === "image") return <ImageIcon size={14} className="text-[#666]" />;
  if (type === "pdf") return <FileType size={14} className="text-[#666]" />;
  return <File size={14} className="text-[#666]" />;
}

export default function ItemCard({
  item,
  libraryName,
  libraryColor,
  index,
  onOpen,
  onDelete,
  onOpenInEditor,
}: ItemCardProps) {
  const isBookCard = item.type === "pdf" && Boolean(item.metadata.thumbnail);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
      className="break-inside-avoid mb-4 group"
    >
      <div
        onClick={onOpenInEditor ?? onOpen}
        className={
          isBookCard
            ? "cursor-pointer relative hover:-translate-y-1 transition-transform duration-200"
            : "bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer relative"
        }
      >
        {/* Delete button — visible on hover (non-book cards only) */}
        {!isBookCard && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-md bg-white/80 backdrop-blur-sm text-[#999] hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Delete item"
          >
            <Trash2 size={13} />
          </button>
        )}

        {/* Pencil hint — visible on hover when editor is available (non-book cards only) */}
        {!isBookCard && onOpenInEditor && (
          <div className="absolute top-2.5 right-10 z-10 p-1.5 rounded-md bg-white/80 backdrop-blur-sm text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <PencilLine size={13} />
          </div>
        )}

        {/* Image card: thumbnail at top */}
        {item.type === "image" && item.content && (
          <div className="relative w-full max-h-44 overflow-hidden">
            <Image
              src={item.content}
              alt={item.title}
              width={item.metadata.dimensions?.width || 400}
              height={item.metadata.dimensions?.height || 300}
              unoptimized
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Book-style PDF card: portrait cover with spine and gradient overlay */}
        {item.type === "pdf" && item.metadata.thumbnail ? (
          <div className="flex" style={{ filter: "drop-shadow(3px 5px 10px rgba(0,0,0,0.18))" }}>
            {/* Left spine stripe */}
            <div
              className="w-[5px] rounded-l-xl shrink-0"
              style={{ backgroundColor: libraryColor }}
            />
            {/* Cover */}
            <div className="relative w-full aspect-[2/3] overflow-hidden rounded-r-xl">
              <Image
                src={item.metadata.thumbnail}
                alt={item.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              {/* Page-edge sheen */}
              <div className="absolute inset-y-0 right-0 w-[4px] bg-gradient-to-r from-transparent to-black/25" />

              {/* PDF badge */}
              <span className="absolute top-2.5 left-2.5 text-[9px] font-bold px-1.5 py-[3px] rounded bg-black/40 backdrop-blur-sm text-white/75 uppercase tracking-wider">
                PDF
              </span>

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-white/70 hover:text-red-400 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Delete item"
              >
                <Trash2 size={13} />
              </button>

              {/* Title area at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: libraryColor }} />
                  <span className="text-[10px] text-white/60 truncate">{libraryName}</span>
                </div>
                <h3 className="text-[13px] font-semibold text-white leading-snug line-clamp-3">{item.title}</h3>
                {item.metadata.pageCount && (
                  <p className="text-[10px] text-white/40 mt-1">{item.metadata.pageCount} pages</p>
                )}
              </div>
            </div>
          </div>
        ) : item.type === "pdf" ? (
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <div className="w-7 h-7 rounded-md bg-[#FEF2F2] flex items-center justify-center">
              <FileType size={14} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1A1A1A] truncate">
                {item.title}
              </p>
            </div>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#666] uppercase">
              PDF
            </span>
          </div>
        ) : null}

        {item.type !== "pdf" || !item.metadata.thumbnail ? (
          <div className="px-4 pt-3 pb-3">
            {/* Library badge at top */}
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: libraryColor }}
              />
              <span className="text-[11px] text-[#888] truncate">
                {libraryName}
              </span>
            </div>

            {/* Title (skip for PDF without thumbnail since it's in the file bar) */}
            {item.type !== "pdf" && (
              <h3 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2">
                {item.title}
              </h3>
            )}

            {/* Preview text */}
            {item.type !== "image" && (
              <p className="mt-1.5 text-xs text-[#777] line-clamp-4 whitespace-pre-wrap leading-relaxed">
                {item.preview}
              </p>
            )}

            {/* File type badge for non-PDF non-image */}
            {item.type !== "pdf" && item.type !== "image" && (
              <div className="mt-2.5 flex items-center gap-1.5">
                {iconForType(item.type)}
                <span className="text-[10px] text-[#999] uppercase">
                  {item.type}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
