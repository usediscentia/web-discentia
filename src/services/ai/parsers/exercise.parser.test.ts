import { describe, it, expect } from "vitest";
import { parseExerciseFromResponse, detectExerciseIntent } from "./exercise.parser";

describe("parseExerciseFromResponse", () => {
  const msgId = "msg-1";

  it("parses flashcard from JSON code block", () => {
    const content = `\`\`\`json
{"type":"flashcard","title":"Test","data":{"cards":[{"id":"c1","front":"Q","back":"A"}]}}
\`\`\``;
    const result = parseExerciseFromResponse(content, msgId);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("flashcard");
    expect(result!.data.cards).toHaveLength(1);
  });

  it("parses quiz from bare JSON object", () => {
    const content = `Here is your quiz: {"type":"quiz","title":"History","data":{"questions":[{"id":"q1","question":"What year?","options":["1914","1939"],"answer":"1939"}]}}`;
    const result = parseExerciseFromResponse(content, msgId);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("quiz");
  });

  it("returns null for invalid JSON", () => {
    expect(parseExerciseFromResponse("not json at all", msgId)).toBeNull();
  });

  it("returns null for unknown exercise type", () => {
    const content = `{"type":"unknown","data":{"stuff":[]}}`;
    expect(parseExerciseFromResponse(content, msgId)).toBeNull();
  });

  it("returns null when data fails structural validation", () => {
    const content = `{"type":"flashcard","data":{"cards":[]}}`;
    expect(parseExerciseFromResponse(content, msgId)).toBeNull();
  });

  it("normalises single-card shorthand into cards array", () => {
    const content = `{"type":"flashcard","data":{"front":"Capital of France","back":"Paris"}}`;
    const result = parseExerciseFromResponse(content, msgId);
    expect(result).not.toBeNull();
    expect(Array.isArray(result!.data.cards)).toBe(true);
    expect(result!.data.cards[0].front).toBe("Capital of France");
  });

  it("repairs trailing commas in JSON", () => {
    const content = `\`\`\`json
{"type":"flashcard","title":"T","data":{"cards":[{"id":"c1","front":"Q","back":"A",}],}}
\`\`\``;
    const result = parseExerciseFromResponse(content, msgId);
    expect(result).not.toBeNull();
  });

  it("assigns a unique id and messageId", () => {
    const content = `{"type":"flashcard","data":{"cards":[{"id":"c1","front":"Q","back":"A"}]}}`;
    const result = parseExerciseFromResponse(content, msgId);
    expect(result!.id).toBeTruthy();
    expect(result!.messageId).toBe(msgId);
  });
});

describe("detectExerciseIntent", () => {
  it("detects flashcard intent with action verb", () => {
    const result = detectExerciseIntent("create flashcards about photosynthesis");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("flashcard");
    expect(result!.topic).toBe("photosynthesis");
  });

  it("detects quiz intent with action verb", () => {
    const result = detectExerciseIntent("generate a quiz based on World War II");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("quiz");
    expect(result!.topic).toBe("World War II");
  });

  it("detects flashcard intent without action verb", () => {
    const result = detectExerciseIntent("flashcards on the French Revolution");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("flashcard");
  });

  it("detects quiz intent without action verb", () => {
    const result = detectExerciseIntent("quiz about metabolism");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("quiz");
  });

  it("returns null for factual question", () => {
    expect(detectExerciseIntent("What is photosynthesis?")).toBeNull();
  });

  it("returns null for plain conversation", () => {
    expect(detectExerciseIntent("Can you explain osmosis to me?")).toBeNull();
  });

  it("falls back to full message as topic when no preposition found", () => {
    const result = detectExerciseIntent("I want some flashcards");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("flashcard");
    expect(result!.topic).toBeTruthy();
  });
});
