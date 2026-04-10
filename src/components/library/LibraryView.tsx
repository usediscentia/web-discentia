"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, animate } from "motion/react";
import { useLibrary } from "@/hooks/useLibrary";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import type { LibraryItem } from "@/types/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ColorPicker from "@/components/library/ColorPicker";
import AddContentModal from "@/components/library/AddContentModal";
import ItemCard from "@/components/library/ItemCard";
import LibraryEmptyState from "@/components/library/LibraryEmptyState";
import DocumentDetailPage from "@/components/document/DocumentDetailPage";

type DragState = {
  item: LibraryItem;
  libraryColor: string;
  cardRect: DOMRect;
  startX: number;
  startY: number;
  pointerId: number;
} | null;

type PendingDelete = {
  item: LibraryItem;
  timerId: ReturnType<typeof setTimeout>;
} | null;

export default function LibraryView() {
  const {
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
    addTextItem,
    addFiles,
    deleteItem,
    deleteLibrary,
  } = useLibrary();
  const { libraryFocusItemId, setLibraryFocusItemId, setEditorItemId, setActiveView } = useAppStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<LibraryItem | null>(null);
  const [newLibraryName, setNewLibraryName] = useState("");
  const [newLibraryColor, setNewLibraryColor] = useState("#34D399");

  // ── Drag-to-delete state ───────────────────────────────────────────────────
  const [dragState, setDragState] = useState<DragState>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const overlayScale = useMotionValue(1);
  const overlayOpacity = useMotionValue(1);
  const trashRef = useRef<HTMLDivElement>(null);

  const selectedLibraryName = useMemo(() => {
    if (!activeLibraryId) return "All libraries";
    return librariesMap[activeLibraryId]?.name || "Library";
  }, [activeLibraryId, librariesMap]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (
      item: LibraryItem,
      libraryColor: string,
      cardRect: DOMRect,
      pointerX: number,
      pointerY: number,
      pointerId: number
    ) => {
      dragX.set(0);
      dragY.set(0);
      overlayScale.set(1);
      overlayOpacity.set(1);
      setDragState({ item, libraryColor, cardRect, startX: pointerX, startY: pointerY, pointerId });
      // Animate to "picked up" — slight scale-up for physical lift feel
      animate(overlayScale, 1.06, { duration: 0.18, ease: [0.23, 1, 0.32, 1] });
    },
    [dragX, dragY, overlayScale, overlayOpacity]
  );

  // Window-level pointer tracking during drag
  useEffect(() => {
    if (!dragState) return;

    const captured = dragState;

    // Grabbing cursor on body
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const handleMove = (e: PointerEvent) => {
      if (e.pointerId !== captured.pointerId) return;
      dragX.set(e.clientX - captured.startX);
      dragY.set(e.clientY - captured.startY);

      if (trashRef.current) {
        const r = trashRef.current.getBoundingClientRect();
        setIsOverTrash(
          e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top && e.clientY <= r.bottom
        );
      }
    };

    const handleUp = (e: PointerEvent) => {
      if (e.pointerId !== captured.pointerId) return;

      const overTrash = trashRef.current
        ? (() => {
            const r = trashRef.current!.getBoundingClientRect();
            return (
              e.clientX >= r.left && e.clientX <= r.right &&
              e.clientY >= r.top && e.clientY <= r.bottom
            );
          })()
        : false;

      setIsOverTrash(false);

      if (overTrash) {
        // 1. Fly to trash center
        const r = trashRef.current!.getBoundingClientRect();
        const targetX = r.left + r.width / 2 - (captured.cardRect.left + captured.cardRect.width / 2);
        const targetY = r.top + r.height / 2 - (captured.cardRect.top + captured.cardRect.height / 2);

        let arrived = 0;
        const onArrived = () => {
          arrived++;
          if (arrived < 2) return;
          // 2. Shrink into trash
          let shrunk = 0;
          const onShrunk = () => {
            shrunk++;
            if (shrunk < 2) return;
            // 3. Clear overlay, show undo toast
            setDragState(null);
            const capturedItem = captured.item;
            const timerId = setTimeout(() => {
              deleteItem(capturedItem.id);
              setPendingDelete(null);
            }, 4000);
            setPendingDelete({ item: capturedItem, timerId });
          };
          animate(overlayScale, 0, { duration: 0.15, ease: [0.4, 0, 1, 1], onComplete: onShrunk });
          animate(overlayOpacity, 0, { duration: 0.15, ease: [0.4, 0, 1, 1], onComplete: onShrunk });
        };

        animate(dragX, targetX, { type: "spring", stiffness: 380, damping: 28, mass: 0.8, onComplete: onArrived });
        animate(dragY, targetY, { type: "spring", stiffness: 380, damping: 28, mass: 0.8, onComplete: onArrived });
      } else {
        // Spring return to origin
        let returned = 0;
        const onReturned = () => {
          returned++;
          if (returned === 2) setDragState(null);
        };
        animate(overlayScale, 1, { type: "spring", stiffness: 400, damping: 30 });
        animate(dragX, 0, { type: "spring", stiffness: 450, damping: 35, mass: 0.8, onComplete: onReturned });
        animate(dragY, 0, { type: "spring", stiffness: 450, damping: 35, mass: 0.8, onComplete: onReturned });
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragState, dragX, dragY, overlayScale, overlayOpacity, deleteItem]);

  const groupedItems = useMemo(() => {
    const pendingId = pendingDelete?.item.id;
    if (activeLibraryId) {
      const lib = librariesMap[activeLibraryId];
      return lib
        ? [{ library: lib, items: items.filter((i) => i.id !== pendingId) }]
        : [];
    }
    return libraries
      .map((lib) => ({
        library: lib,
        items: items.filter((i) => i.libraryId === lib.id && i.id !== pendingId),
      }))
      .filter((g) => g.items.length > 0);
  }, [activeLibraryId, items, libraries, librariesMap, pendingDelete]);

  useEffect(() => {
    if (!libraryFocusItemId) return;

    StorageService.getLibraryItem(libraryFocusItemId).then((item) => {
      if (item) {
        setActiveLibraryId(item.libraryId);
        setDetailItem(item);
      }
      setLibraryFocusItemId(null);
    });
  }, [libraryFocusItemId, setActiveLibraryId, setLibraryFocusItemId]);

  const handleCreateLibrary = async () => {
    const created = await createLibrary(newLibraryName, newLibraryColor);
    if (!created) return;
    setNewLibraryName("");
    setCreateOpen(false);
  };

  const handleAddNote = async (data: {
    title: string;
    content: string;
    type: "text" | "markdown";
  }) => {
    if (!activeLibraryId) return;
    await addTextItem({
      libraryId: activeLibraryId,
      title: data.title || "Untitled note",
      content: data.content,
      type: data.type,
    });
  };

  const handleAddFiles = async (files: File[]) => {
    if (!activeLibraryId) return;
    await addFiles(activeLibraryId, files);
  };

  const handleDeleteItem = useCallback(
    (item: LibraryItem) => {
      // Clear any existing pending delete first
      if (pendingDelete) {
        clearTimeout(pendingDelete.timerId);
        deleteItem(pendingDelete.item.id);
      }
      const timerId = setTimeout(() => {
        deleteItem(item.id);
        setPendingDelete(null);
      }, 4000);
      setPendingDelete({ item, timerId });
    },
    [pendingDelete, deleteItem]
  );

  const handleDeleteActiveLibrary = async () => {
    if (!activeLibraryId) return;
    const library = librariesMap[activeLibraryId];
    const confirmed = window.confirm(
      `Delete library "${library?.name ?? "this library"}" and all its items?`
    );
    if (!confirmed) return;
    await deleteLibrary(activeLibraryId);
  };

  // When a detail item is selected, show the document detail page instead of the grid
  if (detailItem) {
    return (
      <DocumentDetailPage
        item={detailItem}
        library={librariesMap[detailItem.libraryId]}
        onBack={() => setDetailItem(null)}
        onDelete={async () => {
          await handleDeleteItem(detailItem);
          setDetailItem(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAFA]">
      {/* ── Drag Overlay ──────────────────────────────────────────────────── */}
      {dragState && (
        <motion.div
          className="fixed pointer-events-none z-[9999] rounded-[3px] overflow-hidden"
          style={{
            left: dragState.cardRect.left,
            top: dragState.cardRect.top,
            width: dragState.cardRect.width,
            height: dragState.cardRect.height,
            x: dragX,
            y: dragY,
            scale: overlayScale,
            opacity: overlayOpacity,
            backgroundColor: `color-mix(in oklch, black 42%, ${dragState.libraryColor})`,
            boxShadow: "4px 18px 44px rgba(0,0,0,0.42), 0 2px 8px rgba(0,0,0,0.14)",
          }}
        >
          {/* Spine */}
          <div
            className="absolute inset-y-0 left-0 w-[4px] z-10"
            style={{ backgroundColor: `color-mix(in oklch, black 62%, ${dragState.libraryColor})` }}
          />
          {/* Page-edge */}
          <div className="absolute inset-y-0 right-0 w-[3px] bg-gradient-to-r from-transparent to-white/10 z-10" />
          {/* Thumbnail */}
          {dragState.item.type === "pdf" && dragState.item.metadata.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dragState.item.metadata.thumbnail}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Gradient */}
          <div className={
            dragState.item.type === "pdf" && dragState.item.metadata.thumbnail
              ? "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
              : "absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
          } />
          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 p-2 z-20">
            <p className="text-[8.5px] font-bold text-white leading-snug line-clamp-3">
              {dragState.item.title}
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Trash Zone ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {dragState && (
          <motion.div
            className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[9998] pointer-events-none"
            initial={{ opacity: 0, y: 20, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.88 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.div
              ref={trashRef}
              className="pointer-events-auto flex items-center gap-2.5 px-5 py-3 rounded-2xl border"
              animate={
                isOverTrash
                  ? { scale: 1.18, backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }
                  : { scale: 1, backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }
              }
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{ boxShadow: "0 8px 28px -4px rgba(0,0,0,0.14), 0 2px 8px -2px rgba(0,0,0,0.06)" }}
            >
              <motion.div
                animate={isOverTrash ? { color: "#EF4444" } : { color: "#9CA3AF" }}
                transition={{ duration: 0.15 }}
              >
                <Trash2 size={17} />
              </motion.div>
              <motion.span
                animate={isOverTrash ? { color: "#EF4444" } : { color: "#9CA3AF" }}
                transition={{ duration: 0.15 }}
                className="text-[13px] font-medium"
              >
                {isOverTrash ? "Release to delete" : "Drag here to delete"}
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Undo Toast ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto"
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center gap-3 bg-[#111111] text-white pl-4 pr-3 py-3 rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.35)]">
              <Trash2 size={15} className="text-white/50 shrink-0" />
              <span className="text-[13px] font-medium text-white/70">Deleted</span>
              <span className="text-[13px] font-medium text-white truncate max-w-[200px]">
                {pendingDelete.item.title}
              </span>
              <button
                onClick={() => {
                  clearTimeout(pendingDelete.timerId);
                  setPendingDelete(null);
                }}
                className="ml-1 text-[13px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer shrink-0"
                style={{ transition: "color 150ms ease-out" }}
              >
                Undo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-8 pt-8 pb-4 border-b border-[#ECECEC] bg-white">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">My Libraries</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateOpen(true)}
                className="cursor-pointer"
              >
                <Plus size={14} />
                New Library
              </Button>
              <Button
                onClick={() => setAddOpen(true)}
                disabled={!activeLibraryId}
                className="cursor-pointer"
              >
                Add Content
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <motion.button
              onClick={() => setActiveLibraryId(null)}
              whileTap={{ scale: 0.95 }}
              transition={{ scale: { duration: 0.12, ease: [0.23, 1, 0.32, 1] } }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer ${
                activeLibraryId === null
                  ? "bg-[#111] text-white border-[#111]"
                  : "bg-white text-[#555] border-[#E5E7EB] hover:bg-[#F5F5F5] hover:border-[#CCC]"
              }`}
              style={{ transition: "background-color 180ms ease-out, border-color 180ms ease-out, color 180ms ease-out" }}
            >
              All
            </motion.button>
            {libraries.map((library) => {
              const isActive = activeLibraryId === library.id;
              return (
                <motion.button
                  key={library.id}
                  onClick={() => setActiveLibraryId(library.id)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ scale: { duration: 0.12, ease: [0.23, 1, 0.32, 1] } }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "text-[#111]"
                      : "bg-white text-[#555] border-[#E5E7EB] hover:bg-[#F5F5F5] hover:border-[#CCC]"
                  }`}
                  style={{
                    transition: "background-color 180ms ease-out, border-color 180ms ease-out, color 180ms ease-out",
                    ...(isActive
                      ? { backgroundColor: `${library.color}28`, borderColor: library.color }
                      : {}),
                  }}
                >
                  <motion.span
                    className="size-2 rounded-full shrink-0"
                    animate={{ scale: isActive ? 1.25 : 1 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    style={{ backgroundColor: library.color }}
                  />
                  {library.name}
                  <span className="text-[10px] opacity-60">({library.itemCount})</span>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-4 relative w-full max-w-2xl">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search in ${selectedLibraryName}`}
              className="pl-9 bg-[#F9F9F9]"
            />
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 w-fit">
              {error}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto px-8 py-6">
          {isLoading ? (
            <p className="text-sm text-[#777]">Loading library...</p>
          ) : items.length === 0 ? (
            <LibraryEmptyState
              hasLibraries={libraries.length > 0}
              onAddContent={() => setAddOpen(true)}
              onCreateLibrary={() => setCreateOpen(true)}
            />
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-8"
              >
                {groupedItems.map(({ library, items: groupItems }) => (
                  <div key={library.id}>
                    {!activeLibraryId && (
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: library.color }}
                        />
                        <span className="text-sm font-semibold text-[#111]">
                          {library.name}
                        </span>
                        <span className="text-sm text-[#AAA]">
                          · {groupItems.length} {groupItems.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-x-4 gap-y-5">
                      {groupItems.map((item, i) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          libraryName={library.name}
                          libraryColor={library.color}
                          index={i}
                          onOpen={() => setDetailItem(item)}
                          onDelete={() => handleDeleteItem(item)}
                          onOpenInEditor={
                            item.type === "markdown" || item.type === "text"
                              ? () => {
                                  setEditorItemId(item.id);
                                  setActiveView("editor");
                                }
                              : undefined
                          }
                          isDragging={dragState?.item.id === item.id}
                          onDragStart={(rect, px, py, pid) =>
                            handleDragStart(item, library.color, rect, px, py, pid)
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Library</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={newLibraryName}
                onChange={(event) => setNewLibraryName(event.target.value)}
                placeholder="Biology, History, Work..."
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="mt-1">
                <ColorPicker value={newLibraryColor} onChange={setNewLibraryColor} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCreateLibrary}
                disabled={!newLibraryName.trim() || isMutating}
                className="cursor-pointer"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddContentModal
        open={addOpen}
        onOpenChange={setAddOpen}
        activeLibraryId={activeLibraryId}
        isMutating={isMutating}
        onAddNote={handleAddNote}
        onAddFiles={handleAddFiles}
      />

      {activeLibraryId && (
        <button
          className="fixed bottom-5 right-5 text-xs text-red-600 bg-white border border-red-200 rounded-md px-3 py-2 cursor-pointer hover:bg-red-50"
          onClick={handleDeleteActiveLibrary}
          disabled={isMutating}
        >
          Delete selected library
        </button>
      )}
    </div>
  );
}
