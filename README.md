# Discentia

> Local-first study app that closes the learning loop: **upload content → chat with AI → generate flashcards → spaced repetition review**

All processing runs in the browser. No backend, no cloud sync, no data leaving your device.

<!-- screenshots -->

---

## Why Discentia

Most AI tools let you *query* documents. Discentia makes you *learn* them.

The difference is the full cycle: you don't just get answers — you generate flashcards grounded in your own material, review them with spaced repetition, and track retention over time. Built for people who study sensitive material (law, medicine, competitive exams) and can't afford to upload it to a third-party server.

**Differentiators:**
- **Truly local-first** — IndexedDB storage, AES-GCM encrypted API keys, no telemetry
- **Semantic PDF chunking** — heading detection, header/footer filtering, cross-page context carry
- **Chunk-based citations** — word-overlap scoring against injected chunks, no AI hallucination on sources
- **Standalone flashcard generator** — bypass chat entirely, send a prompt, AI fills the cards
- **SRS with source attribution** — every flashcard remembers which document it came from; review feedback uses the original material as ground truth
- **BYO API keys** — connect OpenAI, OpenRouter, Ollama, or GitHub Copilot; keys never leave your browser

---

## The Study Cycle

```
PDF / Markdown / Text
        ↓
   Library (indexed, chunked)
        ↓
   Chat with citations  ──┐
        ↓                 │
   Flashcard Generator    │  (standalone or from chat)
        ↓                 │
   SRS Deck  ◄────────────┘
        ↓
   Spaced Review (SM-2, AI-evaluated)
        ↓
   Dashboard (streak, heatmap, forecast)
```

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 + React 19 (SPA, all `'use client'`) |
| Styling | Tailwind CSS v4 + shadcn/ui + motion/react |
| State | Zustand (split stores) |
| Storage | Dexie v4 over IndexedDB |
| AI | Provider adapter pattern — OpenAI, OpenRouter, Ollama, Anthropic, GitHub Copilot |
| Editor | Tiptap v3 with markdown, code blocks, tables |
| SRS | SM-2 algorithm |
| Security | AES-GCM encryption for API keys via Web Crypto API |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Configure an AI provider

1. Open **Settings** (gear icon in sidebar)
2. Add an API key for OpenAI, OpenRouter, or GitHub Copilot — or point to a local Ollama instance
3. Keys are encrypted in `localStorage` using a device-local AES-GCM key

### First study session

1. **Library** → create a library → upload a PDF, markdown, or text file
2. **Library** → open the item → click **Generate Flashcards** → write a prompt → add cards to your deck
3. **Review** → work through due cards; AI evaluates your answers against the source material
4. **Dashboard** → track your streak and retention

---

## Architecture

```
UI (React, all client-side)
  → Zustand stores (app, chat, provider)
  → Custom hooks (useChat, useLibrary, useFlashcardGenerator)
    → AI provider adapters (openai, ollama, openrouter)
    → StorageService (single abstraction layer)
      → Dexie / IndexedDB
  → localStorage (provider configs, theme)
  → IndexedDB keystore (AES-GCM key for API key encryption)
```

**Routing** is Zustand-based (`activeView` state), not Next.js file routes. The entire app is a single page.

**AI citations** are extracted deterministically by scoring word overlap between the AI response and the exact chunks that were injected into the context — no prompt engineering, no hallucinated sources.

**PDF chunking** uses a 5-pass semantic pipeline:
1. Y-gap paragraph detection with font-size metadata
2. Heading detection (font size > 1.2× page median)
3. Cross-page header/footer filtering
4. Sentence-boundary splitting (`.` `!` `?` `;`, bullets, numbered lists)
5. Section heading attribution + inter-chunk overlap

---

## Key Files

| Area | File |
|---|---|
| Shell & routing | `src/app/page.tsx`, `src/components/layout/AppShell.tsx` |
| AI providers | `src/services/ai/` |
| Chat orchestration | `src/hooks/useChat.ts` |
| PDF chunking | `src/lib/pdf-chunker.ts` |
| Context injection | `src/lib/tokens.ts` |
| Citations | `src/lib/citations.ts` |
| Flashcard generator | `src/hooks/useFlashcardGenerator.ts` |
| SRS algorithm | `src/lib/sm2.ts` |
| Storage | `src/services/storage/index.ts` |
| Encryption | `src/lib/crypto.ts` |

---

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build (requires internet for Google Fonts)
npm run lint     # ESLint v9
```

---

## Data & Privacy

- All data is stored in your browser's IndexedDB (`discentia` database)
- API keys are encrypted with AES-GCM before being written to `localStorage`
- Nothing is sent to any Discentia server — the app has no backend
- Clearing site data removes everything permanently

---

## Contributing

Issues and PRs are welcome. Please read `CLAUDE.md` for architecture context before contributing.

Branching: `feature/your-feature-name` → PR against `main`
Commits: [Conventional Commits](https://www.conventionalcommits.org/)
