interface ScoreMeterProps {
  label: string;
  value: number;
}

export default function ScoreMeter({ label, value }: ScoreMeterProps) {
  const color = value >= 75 ? '#34D399' : value >= 55 ? '#FBBF24' : '#F87171';

  return (
    <div className="text-center">
      <div className="relative w-10 h-10 mx-auto mb-1">
        <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#1E2D3D" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray="94.2"
            strokeDashoffset={94.2 - (94.2 * value) / 100}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <p className="text-[9px] text-[#475569] uppercase tracking-wider">{label}</p>
    </div>
  );
}
