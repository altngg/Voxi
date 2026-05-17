import { cn } from "../shared/lib/cn";
import { TaskByType } from "../pages/test/TaskByType";
import type { TestTask } from "../pages/test/api/test-queries";

type LessonTaskRowProps = {
  task: TestTask;
  theory?: string;
  isIncorrect?: boolean;
  onAnswerValueChange?: (taskId: string, value: string) => void;
};

export const LessonTaskRow = ({
  task,
  theory,
  isIncorrect = false,
  onAnswerValueChange,
}: LessonTaskRowProps) => {
  return (
    <li
      className={cn(
        "rounded-[20px] border-2 p-4 transition-colors",
        isIncorrect
          ? "border-(--danger) bg-(--bg-error)"
          : "border-(--default-border)",
      )}
    >
      {isIncorrect ? (
        <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-(--danger)">
          <span
            className="inline-block h-2 w-2 rounded-full bg-(--danger)"
            aria-hidden
          />
          Неправильный ответ
        </p>
      ) : null}
      {theory ? (
        <div className="mb-4 rounded-2xl border px-4 py-3">{theory}</div>
      ) : null}
      <TaskByType task={task} onAnswerValueChange={onAnswerValueChange} />
    </li>
  );
};
