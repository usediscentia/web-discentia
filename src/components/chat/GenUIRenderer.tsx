"use client";

import { useMemo } from "react";
import { parseGenUIResponse, hasGenUIBlocks } from "@/lib/genui/parser";
import { getComponent } from "@/lib/genui/registry";
// Side-effect: registers all GenUI components into the registry
import "@/components/chat/genui";

interface GenUIRendererProps {
  content: string;
  textRenderer: (text: string) => React.ReactNode;
}

/**
 * Renders AI response content, replacing GenUI blocks with React components.
 * Text blocks are passed through to the provided textRenderer.
 */
export function GenUIRenderer({ content, textRenderer }: GenUIRendererProps) {
  const blocks = useMemo(() => {
    if (!hasGenUIBlocks(content)) return null;
    return parseGenUIResponse(content);
  }, [content]);

  // No GenUI blocks — use regular text rendering
  if (!blocks) {
    return <>{textRenderer(content)}</>;
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        if (block.type === "text") {
          return <div key={i}>{textRenderer(block.content)}</div>;
        }

        const def = getComponent(block.name);
        if (!def) {
          return (
            <div key={i} className="text-xs text-gray-400 italic">
              [Unknown component: {block.name}]
            </div>
          );
        }

        const Component = def.component as React.ComponentType<{ props: Record<string, unknown> }>;
        return (
          <div key={i} className="my-1">
            <Component props={block.props} />
          </div>
        );
      })}
    </div>
  );
}
