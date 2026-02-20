# Discentia (Phase 1 MVP)

Discentia is a local-first study app with:

- AI chat (OpenAI, OpenRouter, Ollama)
- library management in IndexedDB (Dexie)
- context-aware chat using selected libraries
- citation panel per assistant response

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Zustand for client state
- Dexie for local persistence

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Phase 1 MVP Acceptance Checklist

1. Provider setup
- Open Settings.
- Configure OpenAI/OpenRouter key or test Ollama.
- Send a chat message successfully.

2. Library core
- Create at least one library.
- Add content via note and via file upload (`.txt`, `.md`, image, `.pdf`).
- Refresh page and confirm libraries/items persist.

3. Library-context chat
- In chat input, select one or more libraries in `Add context`.
- Send a question that references your uploaded material.
- Confirm answer changes when you toggle libraries on/off.

4. Citations
- Ask a question that uses library content.
- Confirm assistant message shows `📚 N sources`.
- Open citation panel and click `View` to jump to the item in Library.

5. Conversation management
- Create a new conversation.
- Open previous conversations from sidebar.
- Rename and delete a conversation from sidebar actions.

## Notes

- Data is stored locally in browser IndexedDB (`discentia` database).
- API keys are encrypted and stored locally in `localStorage`.
- `npm run lint` should pass.
- `npm run build` may fail in restricted/offline environments because Next.js tries to fetch Google Fonts (`Inter`) during build.
