"use client";

interface WordScore {
  word: string;
  accuracyScore: number;
  errorType: string;
}

interface Props {
  words: WordScore[];
}

function getWordColor(score: number): string {
  if (score >= 85) return "text-green-400";
  if (score >= 65) return "text-yellow-400";
  return "text-red-400";
}

function getWordBg(score: number): string {
  if (score >= 85) return "bg-green-400/20 border-green-400/40";
  if (score >= 65) return "bg-yellow-400/20 border-yellow-400/40";
  return "bg-red-400/20 border-red-400/40";
}

export default function WordScoreDisplay({ words }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {words.map((w, i) => (
        <div
          key={i}
          className={`border rounded-xl px-3 py-2 flex flex-col items-center ${getWordBg(w.accuracyScore)}`}
        >
          <span className={`font-bold text-lg ${getWordColor(w.accuracyScore)}`}>
            {w.word}
          </span>
          <span className={`text-xs font-medium ${getWordColor(w.accuracyScore)}`}>
            {w.accuracyScore}%
          </span>
        </div>
      ))}
    </div>
  );
}
