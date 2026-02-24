"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import EditorToolbar from "./EditorToolbar";
import "./editor.css";

interface MarkdownEditorProps {
  initialContent?: string;
  onUpdate?: (html: string) => void;
  isEmpty?: boolean;
}

export default function MarkdownEditor({
  initialContent,
  onUpdate,
  isEmpty,
}: MarkdownEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your notes...",
      }),
    ],
    content: initialContent || "",
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none min-h-[200px] px-20 py-8",
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== undefined && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <EditorToolbar editor={editor} isEmpty={isEmpty} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
