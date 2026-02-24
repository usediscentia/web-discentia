"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  CodeSquare,
  Quote,
  Minus,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
  isEmpty?: boolean;
}

interface ToolbarButton {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  action: () => void;
  isActive: () => boolean;
}

export default function EditorToolbar({ editor, isEmpty }: EditorToolbarProps) {
  if (!editor) return null;

  const groups: ToolbarButton[][] = [
    [
      {
        icon: Bold,
        title: "Bold",
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive("bold"),
      },
      {
        icon: Italic,
        title: "Italic",
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive("italic"),
      },
      {
        icon: Strikethrough,
        title: "Strikethrough",
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive("strike"),
      },
    ],
    [
      {
        icon: Heading1,
        title: "Heading 1",
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: () => editor.isActive("heading", { level: 1 }),
      },
      {
        icon: Heading2,
        title: "Heading 2",
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: () => editor.isActive("heading", { level: 2 }),
      },
      {
        icon: Heading3,
        title: "Heading 3",
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: () => editor.isActive("heading", { level: 3 }),
      },
    ],
    [
      {
        icon: List,
        title: "Bullet list",
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: () => editor.isActive("bulletList"),
      },
      {
        icon: ListOrdered,
        title: "Ordered list",
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: () => editor.isActive("orderedList"),
      },
    ],
    [
      {
        icon: Code,
        title: "Inline code",
        action: () => editor.chain().focus().toggleCode().run(),
        isActive: () => editor.isActive("code"),
      },
      {
        icon: CodeSquare,
        title: "Code block",
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: () => editor.isActive("codeBlock"),
      },
      {
        icon: Quote,
        title: "Blockquote",
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: () => editor.isActive("blockquote"),
      },
      {
        icon: Minus,
        title: "Horizontal rule",
        action: () => editor.chain().focus().setHorizontalRule().run(),
        isActive: () => false,
      },
    ],
  ];

  // When empty, show dimmed toolbar (#D1D5DB)
  const idleColor = isEmpty ? "text-[#D1D5DB]" : "text-[#6B7280]";
  const hoverColor = isEmpty
    ? "hover:text-[#9CA3AF]"
    : "hover:bg-[#F9FAFB] hover:text-[#374151]";

  return (
    <div className="flex items-center gap-1 h-11 px-8 border-b border-[#E5E7EB] bg-white flex-shrink-0">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-5 bg-[#E5E7EB] mx-1.5" />}
          {group.map((btn) => (
            <button
              key={btn.title}
              onClick={btn.action}
              title={btn.title}
              className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${
                btn.isActive()
                  ? "bg-[#F3F4F6] text-[#171717]"
                  : `${idleColor} ${hoverColor}`
              }`}
            >
              <btn.icon size={16} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
