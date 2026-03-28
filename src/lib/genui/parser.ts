export interface GenUITextBlock {
  type: "text";
  content: string;
}

export interface GenUIComponentBlock {
  type: "component";
  name: string;
  props: Record<string, unknown>;
}

export type ParsedBlock = GenUITextBlock | GenUIComponentBlock;

const GENUI_REGEX = /<GenUI:(\w+)>\s*([\s\S]*?)\s*<\/GenUI:\1>/g;

/**
 * Parses AI response text into a sequence of text and component blocks.
 */
export function parseGenUIResponse(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let lastIndex = 0;

  const matches = [...text.matchAll(GENUI_REGEX)];

  for (const match of matches) {
    const matchStart = match.index!;

    // Text before this component
    if (matchStart > lastIndex) {
      const textContent = text.slice(lastIndex, matchStart).trim();
      if (textContent) {
        blocks.push({ type: "text", content: textContent });
      }
    }

    // Parse component props
    const componentName = match[1];
    const propsStr = match[2].trim();

    try {
      const props = JSON.parse(propsStr) as Record<string, unknown>;
      blocks.push({ type: "component", name: componentName, props });
    } catch {
      // JSON parse fail — treat entire match as text
      blocks.push({ type: "text", content: match[0] });
    }

    lastIndex = matchStart + match[0].length;
  }

  // Remaining text after last component
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining) {
      blocks.push({ type: "text", content: remaining });
    }
  }

  // No components found — return whole text
  if (blocks.length === 0 && text.trim()) {
    blocks.push({ type: "text", content: text });
  }

  return blocks;
}

/**
 * Quick check if a string contains any GenUI blocks.
 */
export function hasGenUIBlocks(text: string): boolean {
  return /<GenUI:\w+>/.test(text);
}
