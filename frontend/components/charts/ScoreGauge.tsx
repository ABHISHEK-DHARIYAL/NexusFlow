import React from 'react';

export interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label = 'Score', size = 'md' }) => {
  const clampedScore = Math.min(100, Math.max(0, score));

  let colorClass = 'text-emerald-400 stroke-emerald-500';
  if (clampedScore < 70) colorClass = 'text-rose-400 stroke-rose-500';
  else if (clampedScore < 85) colorClass = 'text-amber-400 stroke-amber-500';

  const dimensions = {
    sm: { size: 80, stroke: 6, text: 'text-xl' },
    md: { size: 120, stroke: 8, text: 'text-3xl' },
    lg: { size: 160, stroke: 10, text: 'text-4xl' },
  };

  const { size: svgSize, stroke, text: textStyle } = dimensions[size];
  const radius = (svgSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
        <svg className="transform -rotate-90" width={svgSize} height={svgSize}>
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            className="stroke-slate-800"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-bold font-mono tracking-tight text-slate-100 ${textStyle}`}>{clampedScore}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</span>
        </div>
      </div>
    </div>
  );
};
