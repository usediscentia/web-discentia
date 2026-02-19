"use client";

import { motion } from "motion/react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

interface CategoryPill {
  label: string;
  color: string;
  dotColor: string;
}

interface LibraryCard {
  id: string;
  title: string;
  description?: string;
  category: string;
  categoryDotColor: string;
  imageUrl?: string;
  imageHeight?: number;
  fileType?: string;
  fileName?: string;
  fileIcon?: "document" | "image";
}

const categories: CategoryPill[] = [
  { label: "Biology", color: "#34D39920", dotColor: "#34D399" },
  { label: "History", color: "#818CF820", dotColor: "#818CF8" },
  { label: "Work", color: "#FBBF2420", dotColor: "#FBBF24" },
  { label: "Personal", color: "#F8717120", dotColor: "#F87171" },
];

const cards: LibraryCard[] = [
  {
    id: "1",
    title: "Cell Structure Notes",
    description: "Detailed notes on prokaryotic and eukaryotic cells, membrane structure...",
    category: "Biology",
    categoryDotColor: "#34D399",
    imageUrl: "https://images.unsplash.com/photo-1707861107096-4c3b8a3ff175?w=400&h=280&fit=crop",
    imageHeight: 140,
  },
  {
    id: "2",
    title: "Renaissance Era Timeline",
    description: "Key events from 14th-17th century. Florence, Medici, da Vinci, Michelangelo...",
    category: "History",
    categoryDotColor: "#818CF8",
  },
  {
    id: "3",
    title: "mitosis-notes.pdf",
    category: "Biology",
    categoryDotColor: "#34D399",
    fileType: "PDF",
    fileName: "mitosis-notes.pdf",
    fileIcon: "document",
  },
  {
    id: "4",
    title: "Q4 Presentation Slides",
    category: "Work",
    categoryDotColor: "#FBBF24",
    imageUrl: "https://images.unsplash.com/photo-1626148750586-df6e1b0bebf2?w=400&h=360&fit=crop",
    imageHeight: 180,
  },
  {
    id: "5",
    title: "Ancient Rome Map",
    description: "Territorial expansion maps from Republic to Empire.",
    category: "History",
    categoryDotColor: "#818CF8",
    imageUrl: "https://images.unsplash.com/photo-1662308687689-ef2dc11ad8e4?w=400&h=320&fit=crop",
    imageHeight: 160,
  },
  {
    id: "6",
    title: "Spanish Vocabulary",
    description: "Common phrases, conjugation tables, and irregular verbs list for B1 level.",
    category: "Personal",
    categoryDotColor: "#F87171",
  },
  {
    id: "7",
    title: "diagram-photosynthesis.png",
    category: "Biology",
    categoryDotColor: "#34D399",
    fileName: "diagram-photosynthesis.png",
    fileIcon: "image",
  },
];

export function LibraryPopulated() {
  const columns = [
    [cards[0], cards[1]],
    [cards[2], cards[3]],
    [cards[4], cards[5], cards[6]],
  ];

  return (
    <div className="flex flex-col gap-6 flex-1 overflow-y-auto w-full px-12 py-8">
      <div className="flex flex-col gap-5 w-full">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-[-0.5px]">
            My Libraries
          </h1>
          <button className="flex items-center gap-2 px-[18px] py-2.5 rounded-3xl bg-[#1A1A1A] cursor-pointer hover:bg-[#333] transition-colors">
            <PlusIcon className="w-4 h-4 text-white" />
            <span className="text-[13px] font-semibold text-white">
              Add Content
            </span>
          </button>
        </div>

        <div className="flex gap-2 w-full flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.label}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[20px] cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: cat.color }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.dotColor }}
              />
              <span className="text-[13px] font-semibold" style={{
                color: cat.dotColor === "#34D399" ? "#1A7A6D" :
                       cat.dotColor === "#818CF8" ? "#4F46E5" :
                       cat.dotColor === "#FBBF24" ? "#B45309" :
                       "#DC2626"
              }}>
                {cat.label}
              </span>
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[20px] border border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] transition-colors">
            <PlusIcon className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="text-[13px] font-medium text-[#6B7280]">New</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full h-11 px-4 rounded-xl bg-[#F3F4F6]">
        <MagnifyingGlassIcon className="w-[18px] h-[18px] text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Search your library..."
          className="flex-1 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] bg-transparent outline-none"
        />
      </div>

      <div className="flex gap-4 w-full flex-1">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-4 flex-1">
            {column.map((card, cardIndex) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (colIndex * 2 + cardIndex) * 0.08 }}
              >
                <LibraryCardComponent card={card} />
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function LibraryCardComponent({ card }: { card: LibraryCard }) {
  return (
    <div className="flex flex-col w-full rounded-xl bg-white border border-[#E5E7EB] overflow-hidden cursor-pointer hover:shadow-sm transition-shadow">
      {card.imageUrl && (
        <div
          className="w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${card.imageUrl})`,
            height: card.imageHeight || 140,
          }}
        />
      )}

      {card.fileIcon && !card.imageUrl && (
        <div className="flex items-center gap-2.5 w-full h-12 px-3.5 bg-[#F3F4F6]">
          {card.fileIcon === "document" ? (
            <DocumentTextIcon className="w-[18px] h-[18px] text-[#6B7280]" />
          ) : (
            <PhotoIcon className="w-[18px] h-[18px] text-[#6B7280]" />
          )}
          <span className="text-[13px] font-medium text-[#1A1A1A]">
            {card.fileName}
          </span>
          {card.fileType && (
            <span className="px-2 py-0.5 rounded-lg bg-[#E5E7EB] text-[10px] font-bold text-[#6B7280]">
              {card.fileType}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: card.categoryDotColor }}
          />
          <span className="text-[11px] font-medium text-[#6B7280]">
            {card.category}
          </span>
        </div>

        {!card.fileIcon && (
          <h3 className="text-sm font-semibold text-[#1A1A1A]">{card.title}</h3>
        )}

        {card.description && (
          <p className="text-xs text-[#6B7280] leading-[1.4]">
            {card.description}
          </p>
        )}
      </div>
    </div>
  );
}
