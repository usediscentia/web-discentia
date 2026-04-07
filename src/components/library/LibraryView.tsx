"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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

  const selectedLibraryName = useMemo(() => {
    if (!activeLibraryId) return "All libraries";
    return librariesMap[activeLibraryId]?.name || "Library";
  }, [activeLibraryId, librariesMap]);

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

  const handleDeleteItem = async (item: LibraryItem) => {
    const confirmed = window.confirm(`Delete "${item.title}"?`);
    if (!confirmed) return;
    await deleteItem(item.id);
  };

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
            <button
              onClick={() => setActiveLibraryId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer ${
                activeLibraryId === null
                  ? "bg-[#111] text-white border-[#111]"
                  : "bg-white text-[#555] border-[#DDD]"
              }`}
            >
              All
            </button>
            {libraries.map((library) => (
              <button
                key={library.id}
                onClick={() => setActiveLibraryId(library.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer flex items-center gap-1.5 ${
                  activeLibraryId === library.id
                    ? "text-[#111] border-[#111]"
                    : "text-[#555] border-[#DDD]"
                }`}
                style={
                  activeLibraryId === library.id
                    ? { backgroundColor: `${library.color}22` }
                    : undefined
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: library.color }}
                />
                {library.name}
                <span className="text-[10px] opacity-75">({library.itemCount})</span>
              </button>
            ))}
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
                className="columns-1 md:columns-2 xl:columns-3 gap-4"
              >
                {items.map((item, i) => {
                  const library = librariesMap[item.libraryId];
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      libraryName={library?.name || "Unknown library"}
                      libraryColor={library?.color || "#CCC"}
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
                    />
                  );
                })}
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
