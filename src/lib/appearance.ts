import { STORAGE_KEYS } from "@/lib/constants";

export type ThemeOption = "light" | "dark" | "system";
export type ResolvedTheme = Exclude<ThemeOption, "system">;
export type FontSizeOption = "small" | "medium" | "large";

export interface AppearancePreferences {
  theme: ThemeOption;
  accentColor: string;
  fontSize: FontSizeOption;
}

type AppearanceStorageKey = keyof Pick<
  typeof STORAGE_KEYS,
  "THEME" | "ACCENT" | "FONT_SIZE"
>;

const LEGACY_STORAGE_KEYS: Record<AppearanceStorageKey, string> = {
  THEME: "discentia_theme",
  ACCENT: "discentia_accent",
  FONT_SIZE: "discentia_font_size",
};

export const ACCENT_COLORS = [
  { hex: "#1A7A6D", label: "Teal" },
  { hex: "#3B82F6", label: "Blue" },
  { hex: "#8B5CF6", label: "Violet" },
  { hex: "#F59E0B", label: "Amber" },
  { hex: "#EF4444", label: "Red" },
  { hex: "#10B981", label: "Emerald" },
  { hex: "#F97316", label: "Orange" },
] as const;

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  theme: "light",
  accentColor: ACCENT_COLORS[0].hex,
  fontSize: "medium",
};

const FONT_SIZE_MAP: Record<FontSizeOption, string> = {
  small: "15px",
  medium: "16px",
  large: "17px",
};

const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function isValidThemeOption(value: string | null): value is ThemeOption {
  return value === "light" || value === "dark" || value === "system";
}

function isValidFontSizeOption(value: string | null): value is FontSizeOption {
  return value === "small" || value === "medium" || value === "large";
}

function normalizeHex(hex: string): string {
  const trimmed = hex.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return DEFAULT_APPEARANCE_PREFERENCES.accentColor;
  }

  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return trimmed.toUpperCase();
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readStorageValue(storageKey: AppearanceStorageKey): string | null {
  if (!isBrowser()) return null;

  const currentKey = STORAGE_KEYS[storageKey];
  const legacyKey = LEGACY_STORAGE_KEYS[storageKey];
  return localStorage.getItem(currentKey) ?? localStorage.getItem(legacyKey);
}

function persistStorageValue(storageKey: AppearanceStorageKey, value: string) {
  if (!isBrowser()) return;

  localStorage.setItem(STORAGE_KEYS[storageKey], value);
  localStorage.removeItem(LEGACY_STORAGE_KEYS[storageKey]);
}

export function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex).slice(1);
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixChannel(base: number, target: number, amount: number) {
  return Math.round(base + (target - base) * amount);
}

function mixHex(hex: string, targetHex: string, amount: number) {
  const base = hexToRgb(hex);
  const target = hexToRgb(targetHex);

  return `rgb(${mixChannel(base.r, target.r, amount)} ${mixChannel(base.g, target.g, amount)} ${mixChannel(base.b, target.b, amount)})`;
}

function getBrandForeground(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#FAFAFA";
}

export function resolveTheme(theme: ThemeOption): ResolvedTheme {
  if (!isBrowser()) {
    return theme === "dark" ? "dark" : "light";
  }

  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return theme;
}

export function getStoredAppearancePreferences(): AppearancePreferences {
  const storedTheme = readStorageValue("THEME");
  const storedAccent = readStorageValue("ACCENT");
  const storedFontSize = readStorageValue("FONT_SIZE");

  return {
    theme: isValidThemeOption(storedTheme)
      ? storedTheme
      : DEFAULT_APPEARANCE_PREFERENCES.theme,
    accentColor: storedAccent
      ? normalizeHex(storedAccent)
      : DEFAULT_APPEARANCE_PREFERENCES.accentColor,
    fontSize: isValidFontSizeOption(storedFontSize)
      ? storedFontSize
      : DEFAULT_APPEARANCE_PREFERENCES.fontSize,
  };
}

export function persistAppearancePreferences(
  preferences: AppearancePreferences
) {
  persistStorageValue("THEME", preferences.theme);
  persistStorageValue("ACCENT", normalizeHex(preferences.accentColor));
  persistStorageValue("FONT_SIZE", preferences.fontSize);
}

function setBrandVariables(root: HTMLElement, accentColor: string) {
  const brand = normalizeHex(accentColor);
  const { r, g, b } = hexToRgb(brand);

  root.style.setProperty("--brand", brand);
  root.style.setProperty("--brand-foreground", getBrandForeground(brand));
  root.style.setProperty("--brand-hover", mixHex(brand, "#000000", 0.12));
  root.style.setProperty("--brand-soft", `rgba(${r}, ${g}, ${b}, 0.14)`);
  root.style.setProperty(
    "--brand-soft-foreground",
    mixHex(brand, "#FFFFFF", 0.08)
  );
  root.style.setProperty("--brand-ring", `rgba(${r}, ${g}, ${b}, 0.28)`);
}

export function applyAppearanceToDocument(
  preferences: AppearancePreferences
): ResolvedTheme {
  if (!isBrowser()) return "light";

  const root = document.documentElement;
  const resolvedTheme = resolveTheme(preferences.theme);

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
  root.style.fontSize = FONT_SIZE_MAP[preferences.fontSize];
  setBrandVariables(root, preferences.accentColor);

  return resolvedTheme;
}

export function getAppearanceBootScript() {
  return `(() => {
    try {
      const keys = ${JSON.stringify({
        theme: STORAGE_KEYS.THEME,
        accent: STORAGE_KEYS.ACCENT,
        fontSize: STORAGE_KEYS.FONT_SIZE,
      })};
      const legacy = ${JSON.stringify({
        theme: LEGACY_STORAGE_KEYS.THEME,
        accent: LEGACY_STORAGE_KEYS.ACCENT,
        fontSize: LEGACY_STORAGE_KEYS.FONT_SIZE,
      })};
      const defaults = ${JSON.stringify(DEFAULT_APPEARANCE_PREFERENCES)};
      const fontSizeMap = ${JSON.stringify(FONT_SIZE_MAP)};
      const validTheme = { light: true, dark: true, system: true };
      const validFontSize = { small: true, medium: true, large: true };
      const root = document.documentElement;

      const read = (key, legacyKey, fallback) =>
        localStorage.getItem(key) ?? localStorage.getItem(legacyKey) ?? fallback;

      const normalizeHex = (value) => {
        const hex = String(value || "").trim();
        if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return defaults.accentColor;
        if (hex.length === 4) {
          return ("#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]).toUpperCase();
        }
        return hex.toUpperCase();
      };

      const hexToRgb = (hex) => {
        const value = parseInt(normalizeHex(hex).slice(1), 16);
        return {
          r: (value >> 16) & 255,
          g: (value >> 8) & 255,
          b: value & 255,
        };
      };

      const mixChannel = (base, target, amount) =>
        Math.round(base + (target - base) * amount);

      const mixHex = (hex, targetHex, amount) => {
        const base = hexToRgb(hex);
        const target = hexToRgb(targetHex);
        return "rgb(" +
          mixChannel(base.r, target.r, amount) + " " +
          mixChannel(base.g, target.g, amount) + " " +
          mixChannel(base.b, target.b, amount) + ")";
      };

      const brandForeground = (hex) => {
        const { r, g, b } = hexToRgb(hex);
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luminance > 0.6 ? "#111111" : "#FAFAFA";
      };

      const themeValue = read(keys.theme, legacy.theme, defaults.theme);
      const accentColor = normalizeHex(read(keys.accent, legacy.accent, defaults.accentColor));
      const fontSizeValue = read(keys.fontSize, legacy.fontSize, defaults.fontSize);
      const theme = validTheme[themeValue] ? themeValue : defaults.theme;
      const fontSize = validFontSize[fontSizeValue] ? fontSizeValue : defaults.fontSize;

      const resolvedTheme = theme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;

      const { r, g, b } = hexToRgb(accentColor);

      root.classList.toggle("dark", resolvedTheme === "dark");
      root.style.colorScheme = resolvedTheme;
      root.style.fontSize = fontSizeMap[fontSize];
      root.style.setProperty("--brand", accentColor);
      root.style.setProperty("--brand-foreground", brandForeground(accentColor));
      root.style.setProperty("--brand-hover", mixHex(accentColor, "#000000", 0.12));
      root.style.setProperty("--brand-soft", "rgba(" + r + ", " + g + ", " + b + ", 0.14)");
      root.style.setProperty("--brand-soft-foreground", mixHex(accentColor, "#FFFFFF", 0.08));
      root.style.setProperty("--brand-ring", "rgba(" + r + ", " + g + ", " + b + ", 0.28)");
    } catch {}
  })();`;
}
