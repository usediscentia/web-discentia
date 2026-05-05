"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LIBRARY_COLORS } from "@/lib/colors";

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  footer?: (colorName: string | undefined) => React.ReactNode;
}

export default function ColorPicker({ value, onChange, footer }: ColorPickerProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const activeHex = hovered ?? value;
  const activeColor = LIBRARY_COLORS.find((c) => c.hex === activeHex);

  return (
    <div className="select-none">
      <div className="flex items-end gap-px">
        {LIBRARY_COLORS.map((color) => {
          const isSelected = value === color.hex;
          const isActive = hovered === color.hex || isSelected;

          return (
            <div
              key={color.hex}
              className="flex-1 relative h-14 cursor-pointer"
              onPointerEnter={() => setHovered(color.hex)}
              onPointerLeave={() => setHovered(null)}
              onClick={() => onChange(color.hex)}
            >
              <motion.div
                animate={{ y: isActive ? -10 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute inset-x-0 bottom-0 h-14 rounded-t-[3px] overflow-hidden"
                style={{ backgroundColor: color.hex, pointerEvents: "none" }}
              >
                {isSelected && (
                  <motion.div
                    layoutId="spine-selected"
                    className="absolute bottom-0 inset-x-0 h-[3px] bg-white/60"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* shelf board */}
      <div className="h-[3px] rounded-sm bg-[#d1d5db]" />

      {footer ? (
        <div className="mt-3 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {activeColor && (
              <motion.span
                key={activeColor.hex}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.1 }}
                className="text-xs text-[#888] flex items-center gap-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: activeColor.hex }}
                />
                {activeColor.name}
              </motion.span>
            )}
          </AnimatePresence>
          {footer(activeColor?.name)}
        </div>
      ) : (
        <div className="h-5 mt-2 flex items-center">
          <AnimatePresence mode="wait">
            {activeColor && (
              <motion.span
                key={activeColor.hex}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.1 }}
                className="text-xs text-[#888] flex items-center gap-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: activeColor.hex }}
                />
                {activeColor.name}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
