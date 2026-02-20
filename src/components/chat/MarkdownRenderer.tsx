"use client";

import { useState, useCallback, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ExternalLink } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

const customTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: "#0f0f14",
    margin: 0,
    padding: "1rem 1.25rem",
    fontSize: "0.8125rem",
    lineHeight: "1.7",
    borderRadius: 0,
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: "transparent",
    fontSize: "0.8125rem",
    fontFamily:
      '"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", "Menlo", monospace',
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[11px] text-[#8b8b8b] hover:text-[#ccc] transition-colors cursor-pointer px-2 py-1 rounded"
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"code"> & { node?: unknown }) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");

  // Inline code
  if (!match) {
    return (
      <code
        className="text-[0.8125rem] font-medium px-1.5 py-0.5 rounded-[5px] bg-[#F0F1F3] text-[#c7254e] border border-[#e5e5e5]/60"
        style={{
          fontFamily:
            '"JetBrains Mono", "Fira Code", "SF Mono", "Menlo", monospace',
        }}
        {...props}
      >
        {children}
      </code>
    );
  }

  // Block code
  const languageLabels: Record<string, string> = {
    js: "JavaScript",
    jsx: "JSX",
    ts: "TypeScript",
    tsx: "TSX",
    py: "Python",
    python: "Python",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    java: "Java",
    cpp: "C++",
    c: "C",
    cs: "C#",
    php: "PHP",
    swift: "Swift",
    kt: "Kotlin",
    sql: "SQL",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    bash: "Bash",
    sh: "Shell",
    zsh: "Shell",
    md: "Markdown",
    dockerfile: "Docker",
    graphql: "GraphQL",
    xml: "XML",
    toml: "TOML",
  };

  const displayLang = languageLabels[language] || language.toUpperCase();

  return (
    <div className="rounded-xl overflow-hidden border border-[#1e1e28] my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-[#16161c] border-b border-[#27272f]">
        <span className="text-[11px] font-medium text-[#6b6b78] tracking-wide">
          {displayLang}
        </span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        style={customTheme}
        language={language}
        PreTag="div"
        customStyle={{
          background: "#0f0f14",
          margin: 0,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

const markdownComponents = {
  code: CodeBlock,
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="my-2 leading-[1.75] text-[#2a2a2a]" {...props}>
      {children}
    </p>
  ),
  h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1
      className="text-xl font-bold text-[#111] mt-6 mb-2 pb-2 border-b border-[#ECECEC]"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-lg font-bold text-[#111] mt-5 mb-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-[15px] font-semibold text-[#222] mt-4 mb-1.5" {...props}>
      {children}
    </h3>
  ),
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="my-2 ml-1 space-y-1 list-none" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="my-2 ml-1 space-y-1 list-decimal list-inside" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li
      className="text-[#2a2a2a] leading-[1.75] pl-1 relative before:content-['•'] before:text-[#999] before:mr-2 before:text-xs"
      {...props}
    >
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="my-3 pl-4 border-l-[3px] border-[#d1d5db] bg-[#F6F7F9] rounded-r-lg py-2 pr-4 text-[#4a4a4a] italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({
    children,
    href,
    ...props
  }: ComponentPropsWithoutRef<"a">) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#2563EB] hover:text-[#1d4ed8] underline decoration-[#2563EB]/30 hover:decoration-[#1d4ed8]/50 transition-colors inline-flex items-center gap-0.5"
      {...props}
    >
      {children}
      <ExternalLink size={11} className="inline opacity-50" />
    </a>
  ),
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-[#E5E7EB]">
      <table
        className="w-full text-sm border-collapse"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-[#F4F5F7]" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th
      className="text-left text-xs font-semibold text-[#444] px-3 py-2 border-b border-[#E5E7EB]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td
      className="text-[#555] px-3 py-2 border-b border-[#F0F0F0] last:border-b-0"
      {...props}
    >
      {children}
    </td>
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-5 border-t border-[#E5E7EB]" {...props} />
  ),
  strong: ({ children, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-[#111]" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: ComponentPropsWithoutRef<"em">) => (
    <em className="text-[#444] italic" {...props}>
      {children}
    </em>
  ),
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="text-sm text-[#2a2a2a] leading-[1.75]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
