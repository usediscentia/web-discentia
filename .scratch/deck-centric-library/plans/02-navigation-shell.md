# Issue 02 — Shell de navegação: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce navigation to 2 destinations (`decks`, `study`), add `selectedDeckId` deck-open state, move Settings into a modal driven by `dialog.store`, and update Sidebar/MobileNav/CommandPalette — with placeholder Decks views (real ones land in issues 03/04).

**Architecture:** Local-first SPA; `AppShell` switches views off `useAppStore.activeView` (no file routes). This issue narrows `ActiveView` to a 2-value union, which breaks ~12 `setActiveView(...)` call sites in views that stay compiled until issue 09 — those get swept to the nearest live destination with `TODO(issue-NN)` markers. Settings open-state consolidates into `dialog.store` (the `settingsOpen` flag in `app.store` dies; the never-mounted `SettingsDialog.tsx` dies with it).

**Tech Stack:** Next.js 16, React 19, TypeScript, Zustand, Vitest 4 (node env), Tailwind v4, lucide-react, motion/react.

## Global Constraints

- `activeView: "decks" | "study"` only; default `"decks"` (acceptance: zero-state opens on empty Decks).
- `app.store` gains `selectedDeckId: string | null` + `openDeck(id)` / `closeDeck()`. `openDeck` sets `activeView: "decks"`; `setActiveView` always clears `selectedDeckId` (sidebar "Decks" click from detail returns to grid).
- Settings modal state lives in `dialog.store` (`settingsOpen` + `setSettingsOpen`); `app.store.settingsOpen`/`setSettingsOpen` removed.
- Old views (`ChatView`, `LibraryView`, `EditorView`, `StatsView`, `SettingsPage`, `DocumentDetailPage`…) stay compiled but unrouted — deletion is issue 09. Sweep mapping: `"library"`→`"decks"`, `"editor"`→`"decks"` + `// TODO(issue-05)`, `"chat"`→`"decks"` + `// TODO(issue-06)`, `"stats"`→`"study"` + `// TODO(issue-08)`, `"settings"`→settings modal.
- All Dexie access via `StorageService` (existing rule). No new tables/queries needed here.
- Conventional Commits, **no Claude co-author trailer**.
- `npm run build` only green after Task 7 (type narrowing is atomic across tasks); `npm run test:run` green from Task 1 on. Commit per task anyway — feature branch.
- UI copy in pt-BR like surrounding code ("Decks", "Estudar", "Configurações").

## File Structure

| File | Action | Responsibility after this issue |
|---|---|---|
| `src/stores/app.store.ts` | modify | 2-value `ActiveView`, `selectedDeckId`, `openDeck`/`closeDeck`; no settings flag |
| `src/stores/app.store.test.ts` | create | Vitest: nav-state transitions |
| `src/stores/dialog.store.ts` | modify | + `settingsOpen`/`setSettingsOpen` |
| `src/components/providers/SettingsModal.tsx` | create | Dialog wrapper mounting `SettingsPage` content |
| `src/components/providers/SettingsDialog.tsx` | delete | dead (never imported; compile-blocked by flag removal) |
| `src/components/decks/DecksView.tsx` | create | placeholder grid view (issue 03 replaces) |
| `src/components/decks/DeckDetailPage.tsx` | create | placeholder detail (issue 04 replaces) |
| `src/components/layout/AppShell.tsx` | modify | routes `decks`/`study`; mounts `SettingsModal`; 3-item MobileNav |
| `src/components/layout/Sidebar.tsx` | modify | 2 nav items + settings entry; recent-chats section removed |
| `src/components/search/CommandPalette.tsx` | modify | nav commands, deck-by-name, sources→parent deck; conversations section removed |
| sweep: `TodayScreen`, `StudyComplete`, `ChatView`, `ChatEmpty`, `AIProviderSelector`, `LibraryView`, `DocumentDetailPage`, `ReviewComplete`, `EditorView`, `GenerationModal`, `useChat` | modify | no references to dead views / dead flag |

---

### Task 0: Branch

- [ ] **Step 1: Create feature branch off dev**

```bash
git checkout dev && git pull --ff-only 2>/dev/null; git checkout -b feature/deck-centric-02-navigation-shell
```

---

### Task 1: app.store — nav state

**Files:**
- Modify: `src/stores/app.store.ts`
- Test: `src/stores/app.store.test.ts`

**Interfaces:**
- Produces: `type ActiveView = "decks" | "study"`; `useAppStore` fields `activeView`, `selectedDeckId: string | null`, actions `setActiveView(view)`, `openDeck(id: string)`, `closeDeck()`. `settingsOpen`/`setSettingsOpen` GONE. Other fields (`commandPaletteOpen`, `sidebarCollapsed`, `libraryFocusItemId`, `editorItemId`, `studyFilterItemId`, `activeLibraryId`) unchanged (issue 09 cleans up).

- [ ] **Step 1: Write failing test**

Create `src/stores/app.store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "./app.store";

describe("app.store navigation", () => {
  beforeEach(() => {
    useAppStore.setState({ activeView: "decks", selectedDeckId: null });
  });

  it("defaults to decks view with no deck selected", () => {
    expect(useAppStore.getState().activeView).toBe("decks");
    expect(useAppStore.getState().selectedDeckId).toBeNull();
  });

  it("openDeck selects deck and forces decks view", () => {
    useAppStore.getState().setActiveView("study");
    useAppStore.getState().openDeck("d1");
    expect(useAppStore.getState().activeView).toBe("decks");
    expect(useAppStore.getState().selectedDeckId).toBe("d1");
  });

  it("closeDeck clears selection, stays on decks", () => {
    useAppStore.getState().openDeck("d1");
    useAppStore.getState().closeDeck();
    expect(useAppStore.getState().selectedDeckId).toBeNull();
    expect(useAppStore.getState().activeView).toBe("decks");
  });

  it("setActiveView clears deck selection", () => {
    useAppStore.getState().openDeck("d1");
    useAppStore.getState().setActiveView("study");
    expect(useAppStore.getState().selectedDeckId).toBeNull();
    useAppStore.getState().setActiveView("decks");
    expect(useAppStore.getState().activeView).toBe("decks");
    expect(useAppStore.getState().selectedDeckId).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (`selectedDeckId`/`openDeck` don't exist)

```bash
npx vitest run src/stores/app.store.test.ts
```

- [ ] **Step 3: Rewrite store**

Replace `src/stores/app.store.ts` content:

```ts
import { create } from "zustand";

export type ActiveView = "decks" | "study";

interface AppState {
  activeView: ActiveView;
  selectedDeckId: string | null;
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  libraryFocusItemId: string | null;
  editorItemId: string | null;
  studyFilterItemId: string | null;
  activeLibraryId: string | null;
  setActiveView: (view: ActiveView) => void;
  openDeck: (id: string) => void;
  closeDeck: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLibraryFocusItemId: (id: string | null) => void;
  setEditorItemId: (id: string | null) => void;
  setStudyFilterItemId: (id: string | null) => void;
  setActiveLibraryId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "decks",
  selectedDeckId: null,
  commandPaletteOpen: false,
  sidebarCollapsed:
    typeof window !== "undefined"
      ? localStorage.getItem("discentia_sidebar_collapsed") === "1"
      : false,
  libraryFocusItemId: null,
  editorItemId: null,
  studyFilterItemId: null,
  activeLibraryId: null,
  setActiveView: (view) => set({ activeView: view, selectedDeckId: null }),
  openDeck: (id) => set({ activeView: "decks", selectedDeckId: id }),
  closeDeck: () => set({ selectedDeckId: null }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSidebarCollapsed: (collapsed) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("discentia_sidebar_collapsed", collapsed ? "1" : "0");
    }
    set({ sidebarCollapsed: collapsed });
  },
  setLibraryFocusItemId: (id) => set({ libraryFocusItemId: id }),
  setEditorItemId: (id) => set({ editorItemId: id }),
  setStudyFilterItemId: (id) => set({ studyFilterItemId: id }),
  setActiveLibraryId: (id) => set({ activeLibraryId: id }),
}));
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/stores/app.store.test.ts
```

(Build is now red across the app — expected until Task 7.)

- [ ] **Step 5: Commit**

```bash
git add src/stores/app.store.ts src/stores/app.store.test.ts
git commit -m "feat(store): deck-centric nav — activeView decks|study, selectedDeckId, openDeck/closeDeck"
```

---

### Task 2: Settings → modal via dialog.store

**Files:**
- Modify: `src/stores/dialog.store.ts`
- Create: `src/components/providers/SettingsModal.tsx`
- Delete: `src/components/providers/SettingsDialog.tsx`
- Modify: `src/components/chat/ChatEmpty.tsx:51,89`, `src/components/providers/AIProviderSelector.tsx:217`, `src/hooks/useChat.ts:105`

**Interfaces:**
- Consumes: `SettingsPage` (default export, `src/components/providers/SettingsPage.tsx`) — rendered as-is inside the dialog.
- Produces: `useDialogStore` gains `settingsOpen: boolean`, `setSettingsOpen(open: boolean)`. `SettingsModal` (named export) mounted once in `AppShell` (Task 4).

- [ ] **Step 1: Extend dialog.store**

In `src/stores/dialog.store.ts`, add to `DialogState` interface:

```ts
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
```

and to the store implementation (top of the object literal):

```ts
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
```

- [ ] **Step 2: Create SettingsModal**

Create `src/components/providers/SettingsModal.tsx`:

```tsx
"use client";

import { useDialogStore } from "@/stores/dialog.store";
import SettingsPage from "@/components/providers/SettingsPage";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export function SettingsModal() {
  const settingsOpen = useDialogStore((s) => s.settingsOpen);
  const setSettingsOpen = useDialogStore((s) => s.setSettingsOpen);

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-3xl h-[85vh] overflow-y-auto p-0 gap-0">
        <DialogTitle className="sr-only">Configurações</DialogTitle>
        <SettingsPage />
      </DialogContent>
    </Dialog>
  );
}
```

Note: read the top of `SettingsPage.tsx` before wiring — if it renders its own full-height page wrapper (e.g. `h-full`/`h-screen` + page padding), keep the component untouched and let the modal scroll (`overflow-y-auto` above). Do NOT restyle SettingsPage in this issue.

- [ ] **Step 3: Delete dead SettingsDialog**

```bash
git rm src/components/providers/SettingsDialog.tsx
```

(It is imported nowhere — verify with `grep -rn "SettingsDialog" src` → only its own file — and it reads the `settingsOpen` flag Task 1 removed, so it no longer compiles.)

- [ ] **Step 4: Sweep settings openers**

- `src/components/chat/ChatEmpty.tsx`: replace `const { setSettingsOpen } = useAppStore();` with `const { setSettingsOpen } = useDialogStore();` (import `useDialogStore` from `@/stores/dialog.store`; drop the `useAppStore` import if now unused).
- `src/components/providers/AIProviderSelector.tsx:217`: replace `setActiveView("settings");` with `useDialogStore.getState().setSettingsOpen(true);` (add import; remove `setActiveView` usage/import if now unused).
- `src/hooks/useChat.ts:105`: replace `setActiveView("settings");` with `useDialogStore.getState().setSettingsOpen(true);` (same import hygiene).

- [ ] **Step 5: Typecheck touched files compile-locally** (build still red overall)

```bash
npx tsc --noEmit 2>&1 | grep -E "dialog.store|SettingsModal|ChatEmpty|AIProviderSelector|useChat" || echo "clean"
```

Expected: `clean` (remaining errors are in files Task 4–7 fix).

- [ ] **Step 6: Commit**

```bash
git add -A src/stores/dialog.store.ts src/components/providers src/components/chat/ChatEmpty.tsx src/hooks/useChat.ts
git commit -m "feat(settings): settings modal via dialog.store, remove app.store flag + dead SettingsDialog"
```

---

### Task 3: Placeholder DecksView + DeckDetailPage

**Files:**
- Create: `src/components/decks/DecksView.tsx`
- Create: `src/components/decks/DeckDetailPage.tsx`

**Interfaces:**
- Consumes: `StorageService.listDecks(): Promise<Deck[]>`, `StorageService.getDeck(id): Promise<Deck | undefined>` (check exact getter name in `src/services/storage/index.ts` — if it's `getDeckById`, use that), `useAppStore` (`openDeck`, `closeDeck`).
- Produces: `DecksView` (default export, no props); `DeckDetailPage` (default export, props `{ deckId: string }`). Issues 03/04 replace their bodies, signatures stay.

- [ ] **Step 1: DecksView placeholder**

Create `src/components/decks/DecksView.tsx` — minimal list so `openDeck` is reachable and zero-state is graceful:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import type { Deck } from "@/types/deck";

// Placeholder — issue 03 replaces with full grid + CRUD.
export default function DecksView() {
  const openDeck = useAppStore((s) => s.openDeck);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    StorageService.listDecks().then(setDecks);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Decks</h1>
      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Layers size={32} />
          <p className="text-sm">Nenhum deck ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => openDeck(deck.id)}
              className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/60 cursor-pointer"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: deck.color }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {deck.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {deck.cardCount} cards
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: DeckDetailPage placeholder**

Create `src/components/decks/DeckDetailPage.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import type { Deck } from "@/types/deck";

// Placeholder — issue 04 replaces with card CRUD + sources + chat.
export default function DeckDetailPage({ deckId }: { deckId: string }) {
  const closeDeck = useAppStore((s) => s.closeDeck);
  const [deck, setDeck] = useState<Deck | null>(null);

  useEffect(() => {
    StorageService.getDeck(deckId).then((d) => setDeck(d ?? null));
  }, [deckId]);

  return (
    <div className="h-full overflow-y-auto p-8">
      <button
        onClick={closeDeck}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        <ArrowLeft size={16} />
        Decks
      </button>
      <h1 className="text-2xl font-semibold text-foreground">
        {deck ? deck.name : "…"}
      </h1>
      {deck && (
        <p className="mt-1 text-sm text-muted-foreground">
          {deck.cardCount} cards
        </p>
      )}
    </div>
  );
}
```

(If `StorageService.getDeck` doesn't exist under that name, use the actual single-deck getter from `src/services/storage/index.ts`; do not add a new one unless none exists — then add a thin `getDeck(id)` delegating to Dexie `decks.get(id)` inside StorageService.)

- [ ] **Step 3: Commit**

```bash
git add src/components/decks
git commit -m "feat(decks): placeholder DecksView and DeckDetailPage for nav shell"
```

---

### Task 4: AppShell — routes + MobileNav + SettingsModal mount

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

**Interfaces:**
- Consumes: `DecksView`, `DeckDetailPage` (Task 3), `SettingsModal` (Task 2), `useAppStore.selectedDeckId`.
- Produces: view routing for the rest of the app; `MobileNav` items study/decks/settings.

- [ ] **Step 1: Rewrite AppShell routing**

In `src/components/layout/AppShell.tsx`:

Imports — remove `ChatView`, `LibraryView`, `SettingsPage`, `EditorView`, `StatsView`, and the now-unused lucide icons; add:

```tsx
import { Layers, Settings, Sparkles } from "lucide-react"
import DecksView from "@/components/decks/DecksView"
import DeckDetailPage from "@/components/decks/DeckDetailPage"
import StudyView from "@/components/study/StudyView"
import { SettingsModal } from "@/components/providers/SettingsModal"
import { useDialogStore } from "@/stores/dialog.store"
```

Replace `MobileNav` with (settings is an action, not a view):

```tsx
function MobileNav() {
  const { activeView, setActiveView } = useAppStore()
  const setSettingsOpen = useDialogStore((s) => s.setSettingsOpen)

  const items = [
    { id: "study" as const, label: "Estudar", icon: Sparkles },
    { id: "decks" as const, label: "Decks", icon: Layers },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-3 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] transition-colors ${
                isActive
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] text-muted-foreground transition-colors"
        >
          <Settings size={18} />
          <span>Ajustes</span>
        </button>
      </div>
    </nav>
  )
}
```

In `AppShell`, pull `selectedDeckId` too:

```tsx
const { activeView, selectedDeckId, setCommandPaletteOpen } = useAppStore()
```

Replace the view switch block (keep the `AnimatePresence`/`motion.div` wrapper; key it so grid↔detail animates):

```tsx
            <motion.div
              key={activeView === "decks" ? `decks-${selectedDeckId ?? "grid"}` : activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              {activeView === "decks" &&
                (selectedDeckId ? (
                  <DeckDetailPage deckId={selectedDeckId} />
                ) : (
                  <DecksView />
                ))}
              {activeView === "study" && <StudyView />}
            </motion.div>
```

Mount the modal next to `GenerationModal` at the bottom:

```tsx
      <MobileNav />
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      <GenerationModal />
      <SettingsModal />
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat(shell): route decks/study, mount settings modal, 3-item mobile nav"
```

---

### Task 5: Sidebar — 2 destinations + settings entry

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: `useDialogStore.setSettingsOpen`, `useAppStore` nav.
- Produces: sidebar with Principal = Decks/Estudar (badge on Estudar), settings button, search button. Recent-chats section REMOVED (global chat is dead; deck chat = issue 06).

- [ ] **Step 1: Rewrite nav data + remove chats**

In `src/components/layout/Sidebar.tsx`:

- Nav arrays become:

```tsx
const primaryNav: { id: ActiveView; label: string; icon: LucideIcon }[] = [
  { id: "decks", label: "Decks", icon: Layers },
  { id: "study", label: "Estudar", icon: Sparkles },
];
```

- Delete `secondaryNav` array. In its place ("Secundário" section), render a settings button styled exactly like `renderNavItem` output but calling the dialog store:

```tsx
        {/* Secundário section */}
        <div className="flex flex-col gap-0.5 px-2 mt-4">
          <span className={`mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground ${fade}`}>
            Secundário
          </span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 rounded-md cursor-pointer transition-colors px-3 py-2 text-muted-foreground hover:bg-muted/60"
            title={sidebarCollapsed ? "Configurações" : undefined}
          >
            <Settings size={18} className="shrink-0" />
            <span className={`text-sm whitespace-nowrap ${fade}`}>Configurações</span>
          </button>
        </div>
```

with `const setSettingsOpen = useDialogStore((s) => s.setSettingsOpen);` (import `useDialogStore`).

- Delete the entire "Recent Chats" block, the `recentChats` state, `refreshChats`, `handleRenameConversation`, `handleDeleteConversation`, and the `useChatStore`/`Conversation`/`StorageService.listConversations` usage they pull in. Keep the `dueCount` effect (badge now on `"study"`: `renderNavItem(item, item.id === "study")` stays valid since study is in `primaryNav`).
- Prune now-unused imports (`MessageSquare`, `BookOpen`, `BarChart2`, `Clock`, `Plus`, `PencilLine`, `Trash2`, `useChatStore`, `Conversation`, `Fragment` if unused). Add `Layers`.

- [ ] **Step 2: Lint the file**

```bash
npx eslint src/components/layout/Sidebar.tsx
```

Expected: no errors (unused imports are the usual trap).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "refactor(sidebar): two destinations + settings modal entry, drop recent chats"
```

---

### Task 6: CommandPalette — nav commands + decks

**Files:**
- Modify: `src/components/search/CommandPalette.tsx`

**Interfaces:**
- Consumes: `useAppStore` (`setActiveView`, `openDeck`), `useDialogStore.setSettingsOpen`, `StorageService.listDecks`, `StorageService.searchDeckSources`.
- Produces: palette result types `command | deck | source`. Conversations section REMOVED (targets dead chat view; deck-chat search returns in issue 06). `setSearchHighlight`/`setActiveConversationId` usage dropped.

- [ ] **Step 1: Rework results model**

In `src/components/search/CommandPalette.tsx`:

- Drop `useChatStore` import, `ConversationResult` interface, conversation state/search, and the whole Conversations JSX section.
- Add static commands + deck results. Core changes (state and derived data):

```tsx
const { commandPaletteOpen, setCommandPaletteOpen, setActiveView, openDeck } =
  useAppStore();
const setSettingsOpen = useDialogStore((s) => s.setSettingsOpen);

const [decks, setDecks] = useState<Deck[]>([]);
const [sourceResults, setSourceResults] = useState<ScoredDeckSource[]>([]);

const NAV_COMMANDS = useMemo(
  () => [
    { id: "nav-decks", label: "Ir para Decks", icon: Layers, run: () => setActiveView("decks") },
    { id: "nav-study", label: "Ir para Estudar", icon: Sparkles, run: () => setActiveView("study") },
    { id: "nav-settings", label: "Abrir Configurações", icon: Settings, run: () => setSettingsOpen(true) },
  ],
  [setActiveView, setSettingsOpen]
);

const commandResults = useMemo(() => {
  const q = query.trim().toLowerCase();
  if (!q) return NAV_COMMANDS;
  return NAV_COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
}, [query, NAV_COMMANDS]);

const deckResults = useMemo(() => {
  const q = query.trim().toLowerCase();
  const list = q ? decks.filter((d) => d.name.toLowerCase().includes(q)) : decks;
  return list.slice(0, 5);
}, [query, decks]);

const allResults = useMemo(
  () => [
    ...commandResults.map((c) => ({ type: "command" as const, data: c })),
    ...deckResults.map((d) => ({ type: "deck" as const, data: d })),
    ...sourceResults.map((r) => ({ type: "source" as const, data: r })),
  ],
  [commandResults, deckResults, sourceResults]
);
```

- On open, keep loading decks (`StorageService.listDecks().then(setDecks)` — also keep the `Map` if the sources section still shows deck name/color, or derive it: `const deckMap = useMemo(() => new Map(decks.map((d) => [d.id, d])), [decks])`).
- Empty-query effect: `StorageService.searchDeckSources({ query: "", limit: 5 }).then(setSourceResults);` (drop the conversations call). Debounced-search effect: only `searchDeckSources`.
- `openResult` becomes:

```tsx
const openResult = useCallback(
  (result: (typeof allResults)[number]) => {
    if (result.type === "command") {
      result.data.run();
    } else if (result.type === "deck") {
      openDeck(result.data.id);
    } else {
      openDeck(result.data.source.deckId); // TODO(issue-05): focus the source inside the deck
    }
    setCommandPaletteOpen(false);
  },
  [openDeck, setCommandPaletteOpen]
);
```

- [ ] **Step 2: Rework results JSX**

Three sections in order, flat `activeIndex` across them (command indexes `0..commandResults.length-1`, then decks, then sources — mirror the existing two-section `globalIdx` arithmetic):

- "Comandos": icon + label rows (same row styling as existing sections, `h-[40px]`).
- "Decks": color dot (`deck.color`), name (use existing `highlight(deck.name, query)`), `cardCount` on the right (`{deck.cardCount} cards` in the `text-[11px] text-[#D1D5DB]` slot).
- "Fontes" (rename from "Library Items"): existing sources rows unchanged except subtitle/dot now come from `deckMap.get(r.source.deckId)`.

Keep the footer and no-results states; "No results" only when `allResults.length === 0 && query.trim()`.

- [ ] **Step 3: Lint**

```bash
npx eslint src/components/search/CommandPalette.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/components/search/CommandPalette.tsx
git commit -m "feat(palette): nav commands, open deck by name, sources open parent deck"
```

---

### Task 7: Call-site sweep — kill dead-view references, build green

**Files:**
- Modify: `src/components/study/TodayScreen.tsx:81,136`, `src/components/study/StudyComplete.tsx:102`, `src/components/chat/ChatView.tsx:184`, `src/components/library/LibraryView.tsx:247,576`, `src/components/document/DocumentDetailPage.tsx:286`, `src/components/review/ReviewComplete.tsx:165`, `src/components/editor/EditorView.tsx:571`, `src/components/generation/GenerationModal.tsx:231`

**Interfaces:**
- Consumes: narrowed `ActiveView` from Task 1.
- Produces: `npm run build` green. (Line numbers are pre-change references — locate by the quoted call.)

- [ ] **Step 1: Apply mapping** (each edit gets the TODO comment on the same line):

| File | Old | New |
|---|---|---|
| `TodayScreen.tsx` (×2) | `setActiveView("library")` | `setActiveView("decks")` |
| `StudyComplete.tsx` | `setActiveView("stats")` | `setActiveView("study") /* TODO(issue-08): stats section */` |
| `ChatView.tsx` | `setActiveView("library")` | `setActiveView("decks") /* TODO(issue-06) */` |
| `LibraryView.tsx` (×2) | `setActiveView("editor")` | `setActiveView("decks") /* TODO(issue-05): contextual editor */` |
| `DocumentDetailPage.tsx` | `setActiveView("chat")` | `setActiveView("decks") /* TODO(issue-06): deck chat */` |
| `ReviewComplete.tsx` | `setActiveView("stats")` | `setActiveView("study") /* TODO(issue-08): stats section */` |
| `EditorView.tsx` | `setActiveView("library")` | `setActiveView("decks")` |
| `GenerationModal.tsx` | `setActiveView(exerciseType === "flashcard" ? "study" : "library")` | `setActiveView(exerciseType === "flashcard" ? "study" : "decks")` |

(Dashboard widgets and `openui/library.tsx` already target `"study"` — untouched. `ChatEmpty`, `AIProviderSelector`, `useChat` were done in Task 2.)

- [ ] **Step 2: Full verification**

```bash
npx tsc --noEmit && npm run build && npm run lint && npm run test:run
```

Expected: all green. If `tsc` surfaces stragglers referencing dead views, sweep them with the same mapping table.

- [ ] **Step 3: Commit**

```bash
git add -A src
git commit -m "refactor(views): sweep dead view targets to decks/study"
```

---

### Task 8: Acceptance smoke + issue status

- [ ] **Step 1: Manual smoke via `verify` skill** (build, launch, drive with Playwright):
  - Fresh profile (zero IndexedDB): app opens on Decks, empty state, console error-free.
  - Sidebar: Decks ↔ Estudar switch; Configurações opens modal; modal opens from Study view too; Esc/backdrop closes.
  - Mobile viewport: bottom nav shows Estudar/Decks/Ajustes; Ajustes opens modal.
  - Cmd+K: shows Comandos (Ir para Decks / Ir para Estudar / Abrir Configurações); with a seeded deck, typing its name lists it and Enter lands on the detail placeholder; back button returns to grid.
- [ ] **Step 2: Mark issue done**

In `.scratch/deck-centric-library/issues/02-navigation-shell.md`, set `Status: ready-for-human`.

```bash
git add .scratch/deck-centric-library/issues/02-navigation-shell.md
git commit -m "docs(issues): mark 02 navigation-shell ready-for-human"
```

---

## Self-Review Notes

- **Spec coverage:** app.store ✔ (T1), AppShell ✔ (T4), Sidebar ✔ (T5), MobileNav ✔ (T4), settings modal + flag consolidation ✔ (T2), CommandPalette ✔ (T6), acceptance criteria ✔ (T7 build/lint, T8 smoke + zero-state).
- **Deliberate scope calls:** recent-chats sidebar section and palette conversation-search removed (both target dead `chat` view; deck chat returns in issue 06). `SettingsDialog.tsx` deleted (unreferenced + compile-blocked). `activeLibraryId`/`editorItemId`/etc. left in app.store — still used by compiled-but-unrouted views; issue 09 removes.
- **Type consistency:** `openDeck(id: string)` / `closeDeck()` used identically in T3/T4/T6; `DeckDetailPage({ deckId })` matches T4 usage; `setSettingsOpen` name identical in dialog.store and all consumers.
