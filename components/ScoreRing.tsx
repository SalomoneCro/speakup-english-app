"use client";

interface Props {
  score: number;
}

function getScoreColor(score: number) {
  if (score >= 80) return "#4ade80"; // green
  if (score >= 50) return "#facc15"; // yellow
  return "#f87171"; // red
}

function getScoreLabel(score: number) {
  if (score >= 90) return "¡Excelente!";
  if (score >= 75) return "¡Muy bien!";
  if (score >= 50) return "Sigue practicando";
  return "Necesitas practicar";
}

export default function ScoreRing({ score }: Props) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle
          cx="55" cy="55" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="10"
        />
        <circle
          cx="55" cy="55" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text
          x="55" y="55"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="22"
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <span className="text-white/80 text-sm font-medium">{getScoreLabel(score)}</span>
    </div>
  );
}
