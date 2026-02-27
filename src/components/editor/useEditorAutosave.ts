"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TurndownService from "turndown";
import { StorageService } from "@/services/storage";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

interface AutosaveOptions {
  itemId: string | null;
  libraryId: string | null;
  title: string;
  itemType?: string;
  onItemCreated?: (id: string) => void;
}

export function useEditorAutosave({
  itemId,
  libraryId,
  title,
  itemType,
  onItemCreated,
}: AutosaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const latestHtml = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemIdRef = useRef(itemId);
  const libraryIdRef = useRef(libraryId);
  const titleRef = useRef(title);

  // Keep refs in sync
  useEffect(() => {
    itemIdRef.current = itemId;
  }, [itemId]);
  useEffect(() => {
    libraryIdRef.current = libraryId;
  }, [libraryId]);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const performSave = useCallback(async () => {
    const html = latestHtml.current;
    const currentLibraryId = libraryIdRef.current;
    const currentTitle = titleRef.current;

    // Don't save empty content without an existing item
    if (!html || html === "<p></p>") {
      if (!itemIdRef.current) return;
    }

    if (!currentLibraryId) return;

    setIsSaving(true);
    try {
      const markdown = turndown.turndown(html || "<p></p>");
      const preview = markdown.replace(/[#*_~`>\-]/g, "").slice(0, 180).trim();

      if (itemIdRef.current) {
        await StorageService.updateLibraryItem(itemIdRef.current, {
          type: "markdown",
          title: currentTitle || "Untitled",
          content: markdown,
          preview,
          metadata: {
            wordCount: markdown.split(/\s+/).filter(Boolean).length,
          },
        });
      } else {
        const item = await StorageService.createLibraryItem({
          libraryId: currentLibraryId,
          type: "markdown",
          title: currentTitle || "Untitled",
          content: markdown,
          preview,
          metadata: {
            wordCount: markdown.split(/\s+/).filter(Boolean).length,
          },
        });
        itemIdRef.current = item.id;
        onItemCreated?.(item.id);
      }
      setLastSavedAt(Date.now());
    } finally {
      setIsSaving(false);
    }
  }, [onItemCreated]);

  const triggerSave = useCallback(
    (html: string) => {
      latestHtml.current = html;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        performSave();
      }, 1500);
    },
    [performSave]
  );

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return performSave();
  }, [performSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    latestHtml.current = "";
    itemIdRef.current = null;
    setLastSavedAt(null);
    setIsSaving(false);
  }, []);

  return { triggerSave, saveNow, isSaving, lastSavedAt, reset };
}
