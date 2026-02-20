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

export interface LibraryItemMetadata {
  fileSize?: number;
  mimeType?: string;
  wordCount?: number;
  pageCount?: number;
  dimensions?: { width: number; height: number };
  thumbnail?: string; // base64 data URL of first page (PDFs)
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
