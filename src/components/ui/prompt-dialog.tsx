"use client";

import { useEffect, useRef, useState } from "react";
import { useDialogStore } from "@/stores/dialog.store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function PromptDialog() {
  const { prompt, resolvePrompt } = useDialogStore();
  const { open, options } = prompt;
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(options.defaultValue ?? "");
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, options.defaultValue]);

  const handleConfirm = () => {
    resolvePrompt(value.trim() || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resolvePrompt(null); }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
          {options.description && (
            <DialogDescription>{options.description}</DialogDescription>
          )}
        </DialogHeader>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={options.placeholder}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => resolvePrompt(null)}>
            {options.cancelLabel ?? "Cancel"}
          </Button>
          <Button onClick={handleConfirm}>
            {options.confirmLabel ?? "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
