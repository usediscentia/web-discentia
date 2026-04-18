import { create } from "zustand";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface PromptOptions {
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
}

interface PromptState {
  open: boolean;
  options: PromptOptions;
  resolve: ((value: string | null) => void) | null;
}

interface DialogState {
  confirm: ConfirmState;
  prompt: PromptState;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  resolveConfirm: (value: boolean) => void;
  showPrompt: (options: PromptOptions) => Promise<string | null>;
  resolvePrompt: (value: string | null) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  confirm: { open: false, options: { title: "" }, resolve: null },
  prompt: { open: false, options: { title: "" }, resolve: null },

  showConfirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({ confirm: { open: true, options, resolve } });
    });
  },

  resolveConfirm: (value) => {
    const { confirm } = get();
    confirm.resolve?.(value);
    set({ confirm: { open: false, options: { title: "" }, resolve: null } });
  },

  showPrompt: (options) => {
    return new Promise<string | null>((resolve) => {
      set({ prompt: { open: true, options, resolve } });
    });
  },

  resolvePrompt: (value) => {
    const { prompt } = get();
    prompt.resolve?.(value);
    set({ prompt: { open: false, options: { title: "" }, resolve: null } });
  },
}));
