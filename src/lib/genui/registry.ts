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
You can embed visual components in your responses using the following syntax.
Place them on their own line. The JSON inside must be valid.

Available components:

${componentDocs}

Example usage:
<GenUI:StatCard>{ "label": "Cards due", "value": "12", "sublabel": "3 overdue" }</GenUI:StatCard>

You can mix regular text with components. Use components when they add clarity — don't force them into every response.`;
}
