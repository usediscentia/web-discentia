"use client";

import { useDialogStore } from "@/stores/dialog.store";
import SettingsPage from "@/components/providers/SettingsPage";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function SettingsModal() {
  const settingsOpen = useDialogStore((s) => s.settingsOpen);
  const setSettingsOpen = useDialogStore((s) => s.setSettingsOpen);

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="h-[85vh] overflow-hidden p-0 gap-0 sm:max-w-3xl">
        <DialogTitle className="sr-only">Configurações</DialogTitle>
        <SettingsPage />
      </DialogContent>
    </Dialog>
  );
}
