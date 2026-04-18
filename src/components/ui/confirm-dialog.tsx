"use client";

import { useDialogStore } from "@/stores/dialog.store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

export function ConfirmDialog() {
  const { t } = useTranslation();
  const { confirm, resolveConfirm } = useDialogStore();
  const { open, options } = confirm;

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) resolveConfirm(false); }}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          {options.description && (
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => resolveConfirm(false)}>
            {options.cancelLabel ?? t("dialogs.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={options.variant === "destructive" ? "destructive" : "default"}
            onClick={() => resolveConfirm(true)}
          >
            {options.confirmLabel ?? t("dialogs.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
