"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

interface ContentPreviewProps {
  content: string;
  libraryColor: string;
}

const COLLAPSED_LINES = 8;

export default function ContentPreview({
  content,
  libraryColor,
}: ContentPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = content.split("\n");
  const needsCollapse = lines.length > COLLAPSED_LINES;

  return (
    <div className="rounded-xl border border-[#E4E3E1] bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#3D3B38]">
          Content Preview
        </h3>
        {needsCollapse && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[#7C7974] cursor-pointer"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Collapse" : "Expand"}
          </Button>
        )}
      </div>

      <div className="relative">
        <div
          className="border-l-2 pl-4"
          style={{ borderColor: libraryColor }}
        >
          <AnimatePresence mode="wait">
            <motion.pre
              key={expanded ? "expanded" : "collapsed"}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="whitespace-pre-wrap break-words font-mono text-sm text-[#5C5A56] leading-relaxed"
            >
              {expanded || !needsCollapse
                ? content
                : lines.slice(0, COLLAPSED_LINES).join("\n")}
            </motion.pre>
          </AnimatePresence>
        </div>

        {!expanded && needsCollapse && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            <div className="relative flex justify-center -mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(true)}
                className="text-xs text-[#7C7974] hover:text-[#3D3B38] cursor-pointer"
              >
                Show full content
                <ChevronDown size={14} className="ml-1" />
              </Button>
            </div>
          </>
        )}

        {expanded && needsCollapse && (
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
              className="text-xs text-[#7C7974] hover:text-[#3D3B38] cursor-pointer"
            >
              Collapse
              <ChevronUp size={14} className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
