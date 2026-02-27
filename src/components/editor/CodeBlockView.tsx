"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState } from "react";

const LANGUAGES = [
  "plaintext", "bash", "c", "cpp", "css", "diff", "go", "graphql",
  "html", "java", "javascript", "json", "kotlin", "lua", "markdown",
  "php", "python", "ruby", "rust", "scss", "shell", "sql", "swift",
  "toml", "typescript", "xml", "yaml",
];

export default function CodeBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const language: string = node.attrs.language || "";
  const [open, setOpen] = useState(false);

  const select = (lang: string) => {
    updateAttributes({ language: lang || null });
    setOpen(false);
    editor.commands.focus();
  };

  return (
    <NodeViewWrapper className="relative my-3 group">
      {/* Language picker */}
      <div className="absolute top-2 right-3 z-10">
        <button
          type="button"
          contentEditable={false}
          onClick={() => setOpen((o) => !o)}
          className="text-[11px] font-mono text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors select-none"
        >
          {language || "plaintext"}
        </button>
        {open && (
          <div
            contentEditable={false}
            className="absolute right-0 top-full mt-1 w-36 max-h-56 overflow-y-auto bg-[#1a1a24] border border-[#2e2e3a] rounded-lg shadow-xl z-20 py-1"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => select(lang)}
                className={`w-full text-left px-3 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                  lang === language
                    ? "text-white bg-[#2a2a38]"
                    : "text-[#9CA3AF] hover:text-white hover:bg-[#2a2a38]"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      <pre className="!mt-0">
        <NodeViewContent as={"code" as "div"} />
      </pre>
    </NodeViewWrapper>
  );
}
