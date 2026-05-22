import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { LessonResultsResponse } from "../shared/api/lesson-result";
import { Button } from "../shared/ui/Button";
import { ArrowRightLine } from "../shared/ui/icons/ArrowRightLine";
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
  languageId: number;
};

const isLessonResultsState = (value: unknown): value is LessonResultsState => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.correctTasks === "number" &&
    typeof o.totalTasks === "number" &&
    Array.isArray(o.newTasks) &&
    typeof o.languageId === "number"
  );
};

type LessonResultsContentProps = {
  data: LessonResultsState;
};

const LessonResultsContent = ({ data }: LessonResultsContentProps) => {
  const navigate = useNavigate();
  const { correctTasks, totalTasks, newTasks, languageId } = data;

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
          languageId,
        },
      });
    }, RESULT_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [pendingResult, navigate, newTasks.length, languageId, newTasks]);

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
        languageId,
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
    <main className="ui-page">
      <section className="ui-card ui-page-section min-h-[calc(100dvh-2rem)] max-w-6xl px-4 py-6">
        <header className="mb-6 flex flex-col items-center gap-1 text-center text-(--text-primary)">
          <h1 className="ui-page-title">Результаты урока</h1>
          <p className="text-base text-(--text-secondary)">
            Правильно: {correctTasks} из {totalTasks}
          </p>
        </header>

        <div className="mb-8 flex flex-col items-center gap-4">
          <CircularPercentGauge label="Правильные ответы" value={percent} />
        </div>

        {hasRetryTasks ? (
          <section className="text-(--text-primary)">
            <h2 className="ui-section-title mb-1">Поработаем над сложным</h2>
            <p className="mb-3 text-base text-(--text-secondary)">
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
                  variant="ghost"
                  isPending={isSubmitPending}
                  onClick={handleRetrySubmit}
                  disabled={!allRetryAnswered}
                >
                  <ArrowRightLine />
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
            <h2 className="ui-section-title">
              Поздравляем! Урок успешно завершён.
            </h2>
            <p className="max-w-md text-base text-(--text-secondary)">
              Вы справились со всеми заданиями. Так держать!
            </p>
            <Button
              buttonType="button"
              buttonName="Перейти на новый урок"
              variant="ghost"
              onClick={() => navigate("/lesson", { replace: true })}
            >
              <ArrowRightLine />
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
