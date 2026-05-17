import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { LessonResultsResponse } from "../shared/api/lesson-result";
import { Button } from "../shared/ui/Button";
import { CircularPercentGauge } from "../widgets/CircularPercentGauge";
import { LessonTaskRow } from "../widgets/LessonTaskRow";
import {
  buildMockTheoryByTaskId,
  useSubmitLessonResultsMutation,
} from "./lesson";
import type { TestTask } from "./test/api/test-queries";
import { isTaskAnswered } from "./test/taskAnswerUtils";

const RESULT_TRANSITION_MS = 2500;

type LessonResultsState = {
  correctTasks: number;
  totalTasks: number;
  newTasks: TestTask[];
};

const isLessonResultsState = (value: unknown): value is LessonResultsState => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.correctTasks === "number" &&
    typeof o.totalTasks === "number" &&
    Array.isArray(o.newTasks)
  );
};

const ArrowIcon = () => (
  <svg
    aria-hidden
    className="h-[15px] w-[135px]"
    viewBox="0 0 135 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M134.707 8.07112C135.098 7.6806 135.098 7.04743 134.707 6.65691L128.343 0.292946C127.953 -0.0975785 127.319 -0.0975785 126.929 0.292946C126.538 0.68347 126.538 1.31664 126.929 1.70716L132.586 7.36401L126.929 13.0209C126.538 13.4114 126.538 14.0446 126.929 14.4351C127.319 14.8256 127.953 14.8256 128.343 14.4351L134.707 8.07112ZM0 7.36401V8.36401H134V7.36401V6.36401H0V7.36401Z"
      fill="currentColor"
    />
  </svg>
);

type LessonResultsContentProps = {
  data: LessonResultsState;
};

const LessonResultsContent = ({ data }: LessonResultsContentProps) => {
  const navigate = useNavigate();
  const { correctTasks, totalTasks, newTasks } = data;

  const [theorySeed] = useState(() => Math.floor(Math.random() * 10_000));
  const [answersByTaskId, setAnswersByTaskId] = useState<
    Record<string, string>
  >({});
  const [pendingResult, setPendingResult] =
    useState<LessonResultsResponse | null>(null);

  const {
    mutate: submitLessonResults,
    isPending: isSubmitPending,
    isError: isSubmitError,
    error: submitError,
  } = useSubmitLessonResultsMutation();

  const theoryByTaskId = useMemo(
    () => buildMockTheoryByTaskId(newTasks, theorySeed),
    [newTasks, theorySeed],
  );

  const incorrectTaskIds = useMemo(
    () => new Set(pendingResult?.incorrectTasks ?? []),
    [pendingResult],
  );

  useEffect(() => {
    if (!pendingResult) {
      return;
    }
    const timer = window.setTimeout(() => {
      navigate("/lesson/result", {
        replace: true,
        state: {
          correctTasks: pendingResult.correctTasks,
          totalTasks: newTasks.length,
          newTasks: pendingResult.newTasks,
        },
      });
    }, RESULT_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [pendingResult, navigate, newTasks.length]);

  const handleAnswerValueChange = useCallback(
    (taskId: string, value: string) => {
      setAnswersByTaskId((prev) => {
        if (prev[taskId] === value) {
          return prev;
        }
        return { ...prev, [taskId]: value };
      });
    },
    [],
  );

  const safeTotal = totalTasks > 0 ? totalTasks : 1;
  const percent = Math.round((correctTasks / safeTotal) * 100);

  const hasRetryTasks = newTasks.length > 0;
  const allRetryAnswered =
    newTasks.length > 0 &&
    newTasks.every((task) =>
      isTaskAnswered(task, answersByTaskId[String(task.id)]),
    );

  const handleRetrySubmit = () => {
    if (!allRetryAnswered || pendingResult) {
      return;
    }
    submitLessonResults(
      {
        taskResults: newTasks.map((task) => ({
          taskId: task.id,
          userAnswer: answersByTaskId[String(task.id)] ?? "",
        })),
      },
      {
        onSuccess: (response) => {
          setPendingResult(response);
        },
      },
    );
  };

  return (
    <main className="box-border h-full min-h-0 overflow-y-auto pb-4 pt-0 sm:px-6">
      <div className="h-4 shrink-0" aria-hidden />
      <section className="mx-auto min-h-[calc(100dvh-2rem)] w-full max-w-6xl rounded-3xl border-4 border-(--default-border) px-4 py-6">
        <header className="mb-6 flex flex-col items-center gap-1 text-center text-(--text-primary)">
          <h1 className="text-2xl font-bold">Результаты урока</h1>
          <p className="text-base opacity-80">
            Правильно: {correctTasks} из {totalTasks}
          </p>
        </header>

        <div className="mb-8 flex flex-col items-center gap-4">
          <CircularPercentGauge label="Правильные ответы" value={percent} />
        </div>

        {hasRetryTasks ? (
          <section className="text-(--text-primary)">
            <h2 className="mb-1 text-lg font-medium">
              Поработаем над сложным
            </h2>
            <p className="mb-3 text-base opacity-80">
              Пройдите ещё несколько заданий, чтобы закрепить материал.
            </p>
            <ol className="space-y-3 text-lg">
              {newTasks.map((task) => (
                <LessonTaskRow
                  key={task.id}
                  task={task}
                  theory={theoryByTaskId[task.id]}
                  isIncorrect={incorrectTaskIds.has(task.id)}
                  onAnswerValueChange={handleAnswerValueChange}
                />
              ))}
            </ol>
            <div className="mt-4 mb-2 flex flex-col items-end gap-2">
              {isSubmitError ? (
                <p className="max-w-full text-right text-sm text-(--danger)">
                  {submitError instanceof Error
                    ? submitError.message
                    : "Не удалось отправить результаты"}
                </p>
              ) : null}
              {pendingResult ? (
                <p
                  className="max-w-full text-right text-base font-medium text-(--text-primary)"
                  role="status"
                >
                  Переходим к результатам...
                </p>
              ) : (
                <Button
                  buttonType="button"
                  buttonName="Завершить повтор"
                  isPending={isSubmitPending}
                  onClick={handleRetrySubmit}
                  disabled={!allRetryAnswered}
                  className="bg-transparent text-(--text-primary) hover:bg-(--bg-primary) hover:text-(--bg-canvas) disabled:opacity-50"
                >
                  <ArrowIcon />
                </Button>
              )}
              {!pendingResult && !allRetryAnswered ? (
                <p className="max-w-full text-right text-sm opacity-70">
                  Ответьте на все задания, чтобы завершить повтор.
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="flex flex-col items-center gap-5 text-center text-(--text-primary)">
            <h2 className="text-xl font-semibold">
              Поздравляем! Урок успешно завершён.
            </h2>
            <p className="max-w-md text-base opacity-80">
              Вы справились со всеми заданиями. Так держать!
            </p>
            <Button
              buttonType="button"
              buttonName="Перейти на новый урок"
              onClick={() => navigate("/lesson", { replace: true })}
              className="bg-transparent text-(--text-primary) hover:bg-(--bg-primary) hover:text-(--bg-canvas)"
            >
              <ArrowIcon />
            </Button>
          </section>
        )}
      </section>
    </main>
  );
};

export const LessonResultsPage = () => {
  const { state } = useLocation();

  if (!isLessonResultsState(state)) {
    return <Navigate to="/lesson" replace />;
  }

  return <LessonResultsContent data={state} />;
};
