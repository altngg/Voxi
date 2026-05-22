import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LessonResultsResponse } from "../shared/api/lesson-result";
import { Button } from "../shared/ui/Button";
import { ArrowRightLine } from "../shared/ui/icons/ArrowRightLine";
import { LessonTaskRow } from "../widgets/LessonTaskRow";
import { ProgressBar } from "../widgets/ProgressBar";
import {
  buildMockTheoryByTaskId,
  useSubmitLessonResultsMutation,
} from "./lesson";
import { isTaskAnswered } from "./test/taskAnswerUtils";
import { useLessonTasksQuery } from "./lesson/api/lesson-tasks";

const LESSON_LANGUAGE_ID = 1;

export const LessonPage = () => {
  const navigate = useNavigate();

  const { data, isPending, error } = useLessonTasksQuery({
    languageId: LESSON_LANGUAGE_ID,
    maxTasks: 3,
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

  const handleGoToResults = useCallback(() => {
    if (!pendingResult) {
      return;
    }
    navigate("/lesson/result", {
      replace: true,
      state: {
        correctTasks: pendingResult.correctTasks,
        totalTasks: tasks.length,
        newTasks: pendingResult.newTasks,
        languageId: LESSON_LANGUAGE_ID,
      },
    });
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
        languageId: LESSON_LANGUAGE_ID,
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
    <main className="ui-page">
      <section className="ui-card ui-page-section min-h-[calc(100dvh-2rem)] max-w-6xl px-4 py-2">
        <div className="sticky top-0 z-30 -mx-4 mb-4 rounded-t-(--radius-card) bg-(--bg-canvas) px-4 pt-2 pb-4">
          <ProgressBar
            totalQuestions={totalQuestions}
            completedQuestions={completedQuestions}
          />
        </div>
        <section className="text-(--text-primary)">
          {isPending ? (
            <p className="text-base text-(--text-secondary)">
              Загружаем задания...
            </p>
          ) : null}
          {error ? (
            <p className="text-base text-(--danger)">
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
            <Button
              buttonType="button"
              buttonName="К результатам"
              variant="ghost"
              onClick={handleGoToResults}
            >
              <ArrowRightLine />
            </Button>
          ) : (
            <Button
              buttonType="button"
              buttonName="Завершить урок"
              variant="ghost"
              isPending={isSubmitPending}
              onClick={handleFinishLesson}
              disabled={
                !allAnswered ||
                isPending ||
                Boolean(error) ||
                tasks.length === 0
              }
            >
              <ArrowRightLine />
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
