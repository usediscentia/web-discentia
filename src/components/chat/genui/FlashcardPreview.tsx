"use client";

import { Badge } from "@/components/ui/badge";

interface FlashcardPreviewProps {
  props: {
    question: string;
    category: string;
  };
}

export function FlashcardPreview({ props }: FlashcardPreviewProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 text-center max-w-sm">
      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
        {props.category}
      </Badge>
      <p className="mt-3 text-base font-medium text-gray-900">{props.question}</p>
    </div>
  );
}
