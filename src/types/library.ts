export interface Library {
  id: string;
  name: string;
  color: string;
  description?: string;
  itemCount: number;
  createdAt: number;
  updatedAt: number;
}

export type LibraryItemType = "text" | "markdown" | "image" | "pdf" | "file";

export interface ContentChunk {
  text: string;
  page: number;      // 1-based page number
  index: number;     // 0-based paragraph index within page
  startChar: number; // character offset in the full `content` string
  endChar: number;
  heading?: string;  // nearest section heading above this chunk (PDFs only)
}

export interface LibraryItemMetadata {
  fileSize?: number;
  mimeType?: string;
  wordCount?: number;
  pageCount?: number;
  dimensions?: { width: number; height: number };
  thumbnail?: string; // base64 data URL of first page (PDFs)
  chunks?: ContentChunk[]; // paragraph-level chunks with position metadata (PDFs only)
}

export interface LibraryItem {
  id: string;
  libraryId: string;
  type: LibraryItemType;
  title: string;
  content: string;
  preview: string;
  rawFile?: Blob;
  metadata: LibraryItemMetadata;
  createdAt: number;
  updatedAt: number;
}
