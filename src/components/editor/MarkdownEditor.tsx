"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import CodeBlockView from "./CodeBlockView";
import { createLowlight, all } from "lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef } from "react";
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
  const lastLoadedContent = useRef<string | undefined>(undefined);
  const lowlight = useRef(createLowlight(all)).current;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView);
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your notes...",
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({ html: false, tightLists: true }),
    ],
    content: initialContent || "",
    onUpdate: ({ editor }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onUpdate?.((editor.storage as any).markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none min-h-[200px] px-20 py-8",
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== undefined && initialContent !== lastLoadedContent.current) {
      lastLoadedContent.current = initialContent;
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
