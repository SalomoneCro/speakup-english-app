"use client";

import { Difficulty } from "@/lib/sentences";

interface Props {
  selected: Difficulty;
  onChange: (d: Difficulty) => void;
  compact?: boolean;
}

const options: { value: Difficulty; label: string; emoji: string; color: string }[] = [
  { value: "easy", label: "Básico", emoji: "🟢", color: "bg-green-500 hover:bg-green-600" },
  { value: "medium", label: "Intermedio", emoji: "🟡", color: "bg-yellow-500 hover:bg-yellow-600" },
  { value: "hard", label: "Avanzado", emoji: "🔴", color: "bg-red-500 hover:bg-red-600" },
];

export default function DifficultySelector({ selected, onChange, compact = false }: Props) {
  return (
    <div className={`flex gap-3 ${compact ? "justify-center" : "flex-col"}`}>
      {!compact && (
        <p className="text-white/70 text-sm text-center mb-1">Elige tu nivel</p>
      )}
      <div className="flex gap-3 justify-center">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              ${opt.color} text-white font-semibold rounded-2xl transition-all duration-200
              ${compact ? "px-3 py-1.5 text-sm" : "px-6 py-3 text-base"}
              ${selected === opt.value
                ? "ring-4 ring-white/60 scale-105 shadow-lg"
                : "opacity-60"
              }
            `}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
