"use client";

import { Check } from "lucide-react";
import { LIBRARY_COLORS } from "@/lib/colors";

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const selectedColor = LIBRARY_COLORS.find((c) => c.hex === value);

  return (
    <div>
      <div className="grid grid-cols-6 gap-2.5">
        {LIBRARY_COLORS.map((color) => {
          const isSelected = value === color.hex;
          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => onChange(color.hex)}
              className="w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
              style={{
                backgroundColor: color.hex,
                boxShadow: isSelected
                  ? `0 0 0 2px white, 0 0 0 4px ${color.hex}`
                  : undefined,
              }}
              title={color.name}
            >
              {isSelected && <Check size={14} className="text-white drop-shadow-sm" />}
            </button>
          );
        })}
      </div>
      {selectedColor && (
        <p className="mt-3 text-xs text-[#888] flex items-center gap-1.5">
          Selected:
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: selectedColor.hex }}
          />
          {selectedColor.name}
        </p>
      )}
    </div>
  );
}
