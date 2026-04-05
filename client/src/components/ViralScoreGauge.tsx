import { useEffect, useRef, useState } from "react";

interface ViralScoreGaugeProps {
  score: number;       // 0–100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

function getColor(score: number): string {
  if (score >= 80) return "oklch(0.75 0.22 140)";  // green
  if (score >= 60) return "oklch(0.75 0.20 85)";   // yellow-green
  if (score >= 40) return "oklch(0.75 0.22 55)";   // amber
  if (score >= 20) return "oklch(0.70 0.22 30)";   // orange
  return "oklch(0.65 0.22 15)";                     // red
}

function getLabel(score: number): string {
  if (score >= 80) return "Viral";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  if (score >= 20) return "Low";
  return "Weak";
}

const SIZES = {
  sm: { r: 20, cx: 26, cy: 26, sw: 4, fontSize: 9, labelSize: 7, total: 52 },
  md: { r: 30, cx: 38, cy: 38, sw: 5, fontSize: 13, labelSize: 9, total: 76 },
  lg: { r: 44, cx: 56, cy: 56, sw: 7, fontSize: 18, labelSize: 11, total: 112 },
};

export function ViralScoreGauge({ score, size = "md", showLabel = true, animated = true }: ViralScoreGaugeProps) {
  const s = SIZES[size];
  const circumference = 2 * Math.PI * s.r;
  // Use 270° arc (3/4 of circle) — starts at 135° (bottom-left), ends at 45° (bottom-right)
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const gapLength = circumference * (1 - arcFraction);

  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!animated) { setDisplayScore(score); return; }
    let current = 0;
    const step = score / 40; // 40 frames
    const tick = () => {
      current = Math.min(current + step, score);
      setDisplayScore(Math.round(current));
      if (current < score) animRef.current = setTimeout(tick, 20);
    };
    animRef.current = setTimeout(tick, 100);
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [score, animated]);

  const fillLength = (displayScore / 100) * arcLength;
  const color = getColor(displayScore);
  const label = getLabel(displayScore);

  // Rotation: arc starts at 135° (bottom-left going clockwise)
  const rotation = 135;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={s.total} height={s.total} viewBox={`0 0 ${s.total} ${s.total}`}>
        {/* Background arc */}
        <circle
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="none"
          stroke="oklch(0.22 0.03 240)"
          strokeWidth={s.sw}
          strokeDasharray={`${arcLength} ${gapLength}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${s.cx} ${s.cy})`}
        />
        {/* Filled arc */}
        <circle
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="none"
          stroke={color}
          strokeWidth={s.sw}
          strokeDasharray={`${fillLength} ${circumference - fillLength}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${s.cx} ${s.cy})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray 0.05s linear" }}
        />
        {/* Score text */}
        <text
          x={s.cx}
          y={s.cy + s.fontSize * 0.35}
          textAnchor="middle"
          fontSize={s.fontSize}
          fontWeight="700"
          fill={color}
          fontFamily="monospace"
        >
          {Math.round(displayScore / 10)}/10
        </text>
      </svg>
      {showLabel && (
        <span
          className="font-mono font-semibold uppercase tracking-wider"
          style={{ fontSize: s.labelSize, color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// Compact inline badge version for source cards
export function ViralScoreBadge({ score }: { score: number }) {
  const normalized = Math.round(score / 10);
  const color = getColor(score);
  const label = getLabel(score);

  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold"
      style={{
        borderColor: `${color}40`,
        backgroundColor: `${color}15`,
        color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
      <span>{normalized}/10</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}
