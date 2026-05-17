import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LessonResultsResponse } from "../shared/api/lesson-result";
import { Button } from "../shared/ui/Button";
import { LessonTaskRow } from "../widgets/LessonTaskRow";
import { ProgressBar } from "../widgets/ProgressBar";
import {
  buildMockTheoryByTaskId,
  useSubmitLessonResultsMutation,
} from "./lesson";
import { isTaskAnswered } from "./test/taskAnswerUtils";
import { useLessonTasksQuery } from "./lesson/api/lesson-tasks";

const RESULT_TRANSITION_MS = 2500;

export const LessonPage = () => {
  const navigate = useNavigate();

  const { data, isPending, error } = useLessonTasksQuery({
    languageId: 1,
    count: 5,
  });

  const tasks = data?.tasks ?? [];
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
    () => buildMockTheoryByTaskId(tasks, theorySeed),
    [tasks, theorySeed],
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
          totalTasks: tasks.length,
          newTasks: pendingResult.newTasks,
        },
      });
    }, RESULT_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [pendingResult, navigate, tasks.length]);

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

  const completedQuestions = tasks.filter((task) =>
    isTaskAnswered(task, answersByTaskId[String(task.id)]),
  ).length;

  const totalQuestions = tasks.length || 5;
  const allAnswered =
    tasks.length > 0 &&
    tasks.every((task) =>
      isTaskAnswered(task, answersByTaskId[String(task.id)]),
    );

  const handleFinishLesson = () => {
    if (!allAnswered || pendingResult) {
      return;
    }
    submitLessonResults(
      {
        taskResults: tasks.map((task) => ({
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
      <section className="mx-auto min-h-[calc(100dvh-2rem)] w-full max-w-6xl rounded-3xl border-4 border-(--default-border) px-4 py-2">
        <div className="sticky top-0 z-30 -mx-4 mb-4 bg-(--bg-canvas) px-4 pb-4 pt-0 rounded-t-3xl">
          <ProgressBar
            totalQuestions={totalQuestions}
            completedQuestions={completedQuestions}
          />
        </div>
        <section className="text-(--text-primary)">
          {isPending ? <p>Загружаем задания...</p> : null}
          {error ? (
            <p className="text-(--danger)">
              {error instanceof Error
                ? error.message
                : "Не удалось загрузить задания"}
            </p>
          ) : null}
          {!isPending && !error ? (
            <ol className="space-y-3 text-lg">
              {tasks.map((task) => (
                <LessonTaskRow
                  key={task.id}
                  task={task}
                  theory={theoryByTaskId[task.id]}
                  isIncorrect={incorrectTaskIds.has(task.id)}
                  onAnswerValueChange={handleAnswerValueChange}
                />
              ))}
            </ol>
          ) : null}
        </section>
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
              buttonName="Завершить урок"
              isPending={isSubmitPending}
              onClick={handleFinishLesson}
              disabled={
                !allAnswered ||
                isPending ||
                Boolean(error) ||
                tasks.length === 0
              }
              className="bg-transparent text-(--text-primary) hover:bg-(--bg-primary) hover:text-(--bg-canvas) disabled:opacity-50"
            >
              <svg
                aria-hidden
                className="h-3.75 w-33.75"
                viewBox="0 0 135 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M134.707 8.07112C135.098 7.6806 135.098 7.04743 134.707 6.65691L128.343 0.292946C127.953 -0.0975785 127.319 -0.0975785 126.929 0.292946C126.538 0.68347 126.538 1.31664 126.929 1.70716L132.586 7.36401L126.929 13.0209C126.538 13.4114 126.538 14.0446 126.929 14.4351C127.319 14.8256 127.953 14.8256 128.343 14.4351L134.707 8.07112ZM0 7.36401V8.36401H134V7.36401V6.36401H0V7.36401Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
          )}
          {!pendingResult && !allAnswered && tasks.length > 0 ? (
            <p className="max-w-full text-right text-sm opacity-70">
              Ответьте на все задания, чтобы завершить урок.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
};
