import type React from "react";

export interface PropSchema {
  type: string;
  description: string;
  required?: boolean;
  items?: Record<string, unknown>;
}

export interface GenUIComponentDef<T = Record<string, unknown>> {
  name: string;
  description: string;
  propsSchema: Record<string, PropSchema>;
  component: React.ComponentType<{ props: T }>;
}

const registry = new Map<string, GenUIComponentDef>();

export function registerComponent<T>(def: GenUIComponentDef<T>) {
  registry.set(def.name, def as GenUIComponentDef);
}

export function getComponent(name: string): GenUIComponentDef | undefined {
  return registry.get(name);
}

export function getAllComponents(): GenUIComponentDef[] {
  return Array.from(registry.values());
}

/**
 * Generates a system prompt appendix describing available UI components.
 * The AI can use <GenUI:ComponentName>{ "prop": "value" }</GenUI:ComponentName> blocks.
 */
export function generateGenUIPrompt(): string {
  const components = getAllComponents();
  if (components.length === 0) return "";

  const componentDocs = components
    .map((c) => {
      const propsDoc = Object.entries(c.propsSchema)
        .map(([key, schema]) => {
          const req = schema.required !== false ? " (required)" : " (optional)";
          return `    - ${key}: ${schema.type}${req} — ${schema.description}`;
        })
        .join("\n");

      return `  <GenUI:${c.name}>{ JSON props }</GenUI:${c.name}>\n    ${c.description}\n    Props:\n${propsDoc}`;
    })
    .join("\n\n");

  return `
GENERATIVE UI COMPONENTS
When reporting study data or generating flashcards, embed visual components in your response.
Syntax: place the tag on its own line with valid JSON inside. You can mix components with regular text.

RULES:
- If user asks about cards due, reviewed, streak, or schedule — use components. Do NOT ask for clarification when you already have the data in USER STUDY STATS.
- dueToday = cards still to review; reviewedToday = cards already reviewed today. Use the right one.
- For flashcard generation requests, use FlashCardBatch so the user can save them with one click.

Available components:

${componentDocs}

Examples:
<GenUI:StatCard>{ "label": "Cards due today", "value": "12", "sublabel": "3 overdue" }</GenUI:StatCard>
<GenUI:StatCard>{ "label": "Current streak", "value": "7 days" }</GenUI:StatCard>
<GenUI:ReviewSchedule>{ "items": [{ "label": "Today", "count": 12 }, { "label": "Tomorrow", "count": 5 }] }</GenUI:ReviewSchedule>
<GenUI:DeckDiagnostic>{ "decks": [{ "name": "Algoritmos", "overdueCards": 8, "retentionRate": 74 }] }</GenUI:DeckDiagnostic>
<GenUI:FlashCardBatch>{ "cards": [{ "question": "O que é Big O?", "answer": "Complexidade assintótica" }], "deckName": "Algoritmos" }</GenUI:FlashCardBatch>`;
}
