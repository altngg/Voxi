const clampPercent = (value: number) =>
  Math.min(100, Math.max(0, Math.round(value)));

type CircularPercentGaugeProps = {
  label: string;
  value: number;
};

export const CircularPercentGauge = ({
  label,
  value,
}: CircularPercentGaugeProps) => {
  const percent = clampPercent(value);
  const size = 200;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="flex flex-col items-center gap-3"
      role="group"
      aria-label={`${label}: ${percent} из 100`}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--bg-secondary)"
            strokeWidth={stroke}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--bg-primary)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none text-(--text-primary)"
          aria-hidden
        >
          <span className="text-[28px] font-semibold tabular-nums sm:text-3xl">
            {percent}
          </span>
          <span className="mt-0.5 text-xs font-medium text-(--text-secondary)">
            /100
          </span>
        </div>
      </div>
      <span className="max-w-36 text-center text-base font-medium leading-snug">
        {label}
      </span>
    </div>
  );
};
