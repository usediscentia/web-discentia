export interface Conversation {
  id: string;
  title: string;
  libraryIds?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  exerciseId?: string;
  citations?: Citation[];
  attachments?: Attachment[];
  timestamp: number;
  provider?: string;
}

export interface Attachment {
  id: string;
  type: "image" | "file";
  name: string;
  mimeType: string;
  data: string;
  size: number;
}

export interface Citation {
  libraryItemId: string;
  libraryId: string;
  itemTitle: string;
  excerpt: string;
  page?: number; // 1-based page number (PDFs with chunk metadata)
}
