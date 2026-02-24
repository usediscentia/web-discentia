"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StorageService } from "@/services/storage";
import type { Library, LibraryItem, LibraryItemType } from "@/types/library";
import { LIBRARY_COLORS } from "@/lib/colors";

function previewFromContent(content: string): string {
  return content.trim().slice(0, 220);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = () => reject(new Error("Invalid image"));
    image.src = dataUrl;
  });
}

async function extractPdfText(file: File): Promise<{ text: string; pageCount?: number; thumbnail?: string }> {
  try {
    const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as {
      getDocument: (arg: { data: ArrayBuffer }) => { promise: Promise<unknown> };
      GlobalWorkerOptions: { workerSrc?: string };
      OPS: Record<string, number>;
    };

    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url
      ).toString();
    }

    const data = await file.arrayBuffer();
    const pdfDoc = (await pdfjs.getDocument({ data }).promise) as {
      numPages: number;
      getPage: (page: number) => Promise<{
        getTextContent: () => Promise<{
          items: Array<{ str?: string }>;
        }>;
      }>;
    };

    const pageTexts: string[] = [];
    for (let page = 1; page <= pdfDoc.numPages; page += 1) {
      const pageData = await pdfDoc.getPage(page);
      const content = await pageData.getTextContent();
      const lines = content.items
        .map((item) => item.str || "")
        .join(" ")
        .trim();
      if (lines) pageTexts.push(lines);
    }

    // Render first page as thumbnail
    let thumbnail: string | undefined;
    try {
      const firstPage = await pdfDoc.getPage(1);
      type PdfPage = {
        getViewport: (opts: { scale: number }) => { width: number; height: number };
        render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
      };
      const page = firstPage as unknown as PdfPage;
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      thumbnail = canvas.toDataURL("image/jpeg", 0.8);
    } catch {
      // thumbnail generation failed, continue without it
    }

    return {
      text: pageTexts.join("\n\n"),
      pageCount: pdfDoc.numPages,
      thumbnail,
    };
  } catch {
    return {
      text: "",
    };
  }
}

async function buildItemFromFile(libraryId: string, file: File) {
  const lower = file.name.toLowerCase();
  const nowType = file.type.toLowerCase();

  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    const content = await file.text();
    return {
      libraryId,
      type: "markdown" as const,
      title: file.name,
      content,
      preview: previewFromContent(content),
      rawFile: file,
      metadata: {
        fileSize: file.size,
        mimeType: file.type || "text/markdown",
        wordCount: content.split(/\s+/).filter(Boolean).length,
      },
    };
  }

  if (lower.endsWith(".txt") || nowType.startsWith("text/")) {
    const content = await file.text();
    return {
      libraryId,
      type: "text" as const,
      title: file.name,
      content,
      preview: previewFromContent(content),
      rawFile: file,
      metadata: {
        fileSize: file.size,
        mimeType: file.type || "text/plain",
        wordCount: content.split(/\s+/).filter(Boolean).length,
      },
    };
  }

  if (lower.endsWith(".pdf") || nowType === "application/pdf") {
    const extracted = await extractPdfText(file);
    const content = extracted.text || "PDF uploaded. Text extraction unavailable for this file.";
    return {
      libraryId,
      type: "pdf" as const,
      title: file.name,
      content,
      preview: previewFromContent(content),
      rawFile: file,
      metadata: {
        fileSize: file.size,
        mimeType: "application/pdf",
        pageCount: extracted.pageCount,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        thumbnail: extracted.thumbnail,
      },
    };
  }

  if (nowType.startsWith("image/")) {
    const dataUrl = await fileToDataUrl(file);
    const dimensions = await getImageDimensions(dataUrl).catch(() => undefined);
    return {
      libraryId,
      type: "image" as const,
      title: file.name,
      content: dataUrl,
      preview: file.name,
      rawFile: file,
      metadata: {
        fileSize: file.size,
        mimeType: file.type,
        dimensions,
      },
    };
  }

  const fallbackContent = await file.text().catch(() => "");
  return {
    libraryId,
    type: "file" as const,
    title: file.name,
    content: fallbackContent,
    preview: previewFromContent(fallbackContent) || file.name,
    rawFile: file,
    metadata: {
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    },
  };
}

export interface CreateTextItemInput {
  libraryId: string;
  title: string;
  content: string;
  type?: Extract<LibraryItemType, "text" | "markdown">;
}

export function useLibrary() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [activeLibraryId, setActiveLibraryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasInitialized, setHasInitialized] = useState(false);

  const refreshLibraries = useCallback(async () => {
    const allLibraries = await StorageService.listLibraries();
    setLibraries(allLibraries);
    setActiveLibraryId((current) => {
      // After first load, preserve null (= "All") as an intentional choice
      if (hasInitialized) {
        if (current === null) return null;
        if (allLibraries.some((library) => library.id === current)) return current;
        return allLibraries[0]?.id || null;
      }
      // First load: default to first library
      return allLibraries[0]?.id || null;
    });
    setHasInitialized(true);
  }, [hasInitialized]);

  const refreshItems = useCallback(async () => {
    const query = searchQuery.trim();
    if (query) {
      const result = await StorageService.searchLibraryItems({
        query,
        libraryIds: activeLibraryId ? [activeLibraryId] : undefined,
        limit: 120,
      });
      setItems(result.map((entry) => entry.item));
      return;
    }

    const list = await StorageService.listLibraryItems(activeLibraryId || undefined);
    setItems(list);
  }, [activeLibraryId, searchQuery]);

  const refresh = useCallback(async () => {
    await refreshLibraries();
    await refreshItems();
  }, [refreshLibraries, refreshItems]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load library");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    refreshItems().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load items");
    });
  }, [refreshItems]);

  const createLibrary = useCallback(
    async (name: string, color?: string, description?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      setIsMutating(true);
      setError(null);
      try {
        const created = await StorageService.createLibrary({
          name: trimmed,
          color: color || LIBRARY_COLORS[libraries.length % LIBRARY_COLORS.length].hex,
          description,
        });
        await refreshLibraries();
        setActiveLibraryId(created.id);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create library");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [libraries.length, refreshLibraries]
  );

  const updateLibrary = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Library, "name" | "color" | "description">>
    ) => {
      setIsMutating(true);
      setError(null);
      try {
        await StorageService.updateLibrary(id, updates);
        await refreshLibraries();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update library");
      } finally {
        setIsMutating(false);
      }
    },
    [refreshLibraries]
  );

  const deleteLibrary = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setError(null);
      try {
        await StorageService.deleteLibrary(id);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete library");
      } finally {
        setIsMutating(false);
      }
    },
    [refresh]
  );

  const addTextItem = useCallback(
    async ({ libraryId, title, content, type = "text" }: CreateTextItemInput) => {
      if (!libraryId || !content.trim()) return null;

      setIsMutating(true);
      setError(null);
      try {
        const created = await StorageService.createLibraryItem({
          libraryId,
          type,
          title: title.trim() || "Untitled note",
          content,
          preview: previewFromContent(content),
          metadata: {
            mimeType: type === "markdown" ? "text/markdown" : "text/plain",
            wordCount: content.split(/\s+/).filter(Boolean).length,
          },
        });
        await refresh();
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add content");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [refresh]
  );

  const addFiles = useCallback(
    async (libraryId: string, files: File[]) => {
      if (!libraryId || files.length === 0) return;

      setIsMutating(true);
      setError(null);
      try {
        for (const file of files) {
          const parsed = await buildItemFromFile(libraryId, file);
          await StorageService.createLibraryItem(parsed);
        }
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to import files");
      } finally {
        setIsMutating(false);
      }
    },
    [refresh]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      setIsMutating(true);
      setError(null);
      try {
        await StorageService.deleteLibraryItem(itemId);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete item");
      } finally {
        setIsMutating(false);
      }
    },
    [refresh]
  );

  const librariesMap = useMemo(() => {
    return libraries.reduce<Record<string, Library>>((acc, library) => {
      acc[library.id] = library;
      return acc;
    }, {});
  }, [libraries]);

  return {
    libraries,
    librariesMap,
    items,
    activeLibraryId,
    setActiveLibraryId,
    searchQuery,
    setSearchQuery,
    isLoading,
    isMutating,
    error,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    addTextItem,
    addFiles,
    deleteItem,
    refresh,
  };
}
