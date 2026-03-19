// Minimal stub for antd — only ConfigProvider is used by antd-style internals pulled in by @lobehub/icons.
import { createContext, useContext, type ReactNode } from "react";

const AntdConfigContext = createContext({});

export function ConfigProvider({ children }: { children: ReactNode }) {
  return children as React.ReactElement;
}

export const theme = {
  useToken: () => ({ token: {} }),
  defaultConfig: {},
};

export function Divider() {
  return null;
}

export function Empty() {
  return null;
}

export function Segmented() {
  return null;
}
