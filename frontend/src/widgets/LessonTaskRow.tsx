import { cn } from "../shared/lib/cn";
import { TaskByType } from "../pages/test/TaskByType";
import type { TestTask } from "../pages/test/api/test-queries";

type LessonTaskRowProps = {
  task: TestTask;
  explanation?: string;
  isIncorrect?: boolean;
  answerValue?: string;
  disabled?: boolean;
  onAnswerValueChange?: (taskId: string, value: string) => void;
};

export const LessonTaskRow = ({
  task,
  explanation,
  isIncorrect = false,
  answerValue,
  disabled = false,
  onAnswerValueChange,
}: LessonTaskRowProps) => {
  return (
    <li
      className={cn(
        "ui-card-inset p-4",
        isIncorrect && "border-(--danger) bg-(--bg-error)",
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
      {isIncorrect && explanation ? (
        <div className="mb-4 rounded-2xl border-2 border-(--soft-border) px-4 py-3 text-base text-(--text-primary)">
          {explanation}
        </div>
      ) : null}
      <TaskByType
        task={task}
        answerValue={answerValue}
        disabled={disabled}
        onAnswerValueChange={onAnswerValueChange}
      />
    </li>
  );
};
