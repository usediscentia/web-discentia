"use client";

import { useState } from "react";
import Image from "next/image";
import { FileType, ZoomIn } from "lucide-react";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LibraryItem } from "@/types/library";

interface DocumentPreviewProps {
  item: LibraryItem;
}

export default function DocumentPreview({ item }: DocumentPreviewProps) {
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const hasThumbnail = item.type === "pdf" && Boolean(item.metadata.thumbnail);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        onClick={() => setFullViewOpen(true)}
        className="relative w-full aspect-[3/4] rounded-xl bg-[#F8F8F7] border border-[#E4E3E1] overflow-hidden cursor-zoom-in group"
      >
        {hasThumbnail ? (
          <Image
            src={item.metadata.thumbnail!}
            alt={item.title}
            fill
            unoptimized
            className="object-cover"
          />
        ) : item.type === "image" && item.content ? (
          <Image
            src={item.content}
            alt={item.title}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <FileType size={40} className="text-[#A8A5A0]" />
            <span className="text-xs text-[#7C7974] font-medium px-4 text-center truncate max-w-full">
              {item.title}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md">
            <ZoomIn size={18} className="text-[#3D3B38]" />
          </div>
        </div>
      </motion.button>

      {/* Full-screen PDF/content viewer */}
      <Dialog open={fullViewOpen} onOpenChange={setFullViewOpen}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 rounded-2xl overflow-hidden">
          <DialogTitle className="sr-only">{item.title}</DialogTitle>
          <ScrollArea className="h-full">
            <div className="p-8">
              {hasThumbnail ? (
                <Image
                  src={item.metadata.thumbnail!}
                  alt={item.title}
                  width={800}
                  height={1100}
                  unoptimized
                  className="w-full h-auto rounded-lg"
                />
              ) : item.type === "image" && item.content ? (
                <Image
                  src={item.content}
                  alt={item.title}
                  width={item.metadata.dimensions?.width || 1200}
                  height={item.metadata.dimensions?.height || 800}
                  unoptimized
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <pre className="whitespace-pre-wrap break-words text-sm text-[#3D3B38] leading-relaxed font-sans">
                  {item.content}
                </pre>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
