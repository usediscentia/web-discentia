"use client";

import Image from "next/image";
import { FileText, ImageIcon, File, FileType, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { LibraryItem } from "@/types/library";

interface ItemCardProps {
  item: LibraryItem;
  libraryName: string;
  libraryColor: string;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
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
}: ItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
      className="break-inside-avoid mb-4 group"
    >
      <div
        onClick={onOpen}
        className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer relative"
      >
        {/* Delete button — visible on hover */}
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

        {/* PDF card: thumbnail if available, otherwise file bar */}
        {item.type === "pdf" && item.metadata.thumbnail ? (
          <div className="relative w-full max-h-44 overflow-hidden">
            <Image
              src={item.metadata.thumbnail}
              alt={item.title}
              width={400}
              height={300}
              unoptimized
              className="w-full h-auto object-cover"
            />
            <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/90 text-[#666] uppercase shadow-sm">
              PDF
            </span>
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

          {/* Title (skip for PDF since it's in the file bar) */}
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
      </div>
    </motion.div>
  );
}
