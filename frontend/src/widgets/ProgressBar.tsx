type ProgressBarProps = {
  totalQuestions: number;
  completedQuestions: number;
  className?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const ProgressBar = ({
  totalQuestions,
  completedQuestions,
  className,
}: ProgressBarProps) => {
  const safeTotal = Math.max(0, totalQuestions);
  const safeCompleted =
    safeTotal === 0 ? 0 : clamp(completedQuestions, 0, safeTotal);

  const progressPercent =
    safeTotal === 0 ? 0 : Math.round((safeCompleted / safeTotal) * 100);

  return (
    <section className={className}>
      <p className="mb-1 text-base font-medium text-(--text-primary)">
        Вопрос {safeCompleted} из {safeTotal}
      </p>

      <div className="h-4 w-full overflow-hidden rounded-full border-2 border-(--default-border)">
        <div
          className="h-full rounded-full bg-(--default-border) transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-label="Прогресс прохождения теста"
        />
      </div>
    </section>
  );
};

export default ProgressBar;
