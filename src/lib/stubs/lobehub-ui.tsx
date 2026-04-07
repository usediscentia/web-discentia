// Minimal stub for @lobehub/ui — only the symbols used by @lobehub/icons are needed.
// This avoids pulling in antd 6.x as a dependency.
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

export const Center = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Center({ children, style, ...props }, ref) {
    return (
      <div
        ref={ref}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const Flexbox = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Flexbox({ children, style, ...props }, ref) {
    return (
      <div ref={ref} style={{ display: "flex", ...style }} {...props}>
        {children}
      </div>
    );
  }
);

export function Icon({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <>{children}</>;
}

export function Tag({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <span>{children}</span>;
}

export function CopyButton() {
  return null;
}

export function Highlighter({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <>{children}</>;
}

export function ActionIcon() {
  return null;
}

export function Block({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <div>{children}</div>;
}

export function Text({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <span>{children}</span>;
}

export function Grid({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <div>{children}</div>;
}

export function SearchBar() {
  return null;
}

export function TooltipGroup({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <>{children}</>;
}
