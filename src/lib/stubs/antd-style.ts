// Minimal stub for antd-style — covers all symbols imported by @lobehub/icons.
export function useThemeMode() {
  return { themeMode: "light", isDarkMode: false };
}

export const cssVar = new Proxy({} as Record<string, string>, {
  get: () => "",
});

export function createStaticStyles() {
  return () => ({});
}

export function cx(...args: (string | undefined | null | false)[]) {
  return args.filter(Boolean).join(" ");
}
