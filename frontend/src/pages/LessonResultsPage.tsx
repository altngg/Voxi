import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { LessonResultsResponse } from "../shared/api/lesson-result";
import {
  ATTEMPT_INTERRUPTED_MESSAGE,
  ATTEMPT_STORAGE_CLEAR_ERROR,
  ATTEMPT_STORAGE_SAVE_ERROR,
} from "../shared/lib/attempt-storage";
import { Button } from "../shared/ui/Button";
import { ArrowRightLine } from "../shared/ui/icons/ArrowRightLine";
import { CircularPercentGauge } from "../widgets/CircularPercentGauge";
import { LessonTaskRow } from "../widgets/LessonTaskRow";
import {
  lessonTasksQueryKey,
  mapExplanationsByTaskId,
  useSubmitLessonResultsMutation,
} from "./lesson";
import {
  clearLessonAttempt,
  clearLessonRetryAttempt,
  loadLessonRetryAttempt,
  saveLessonRetryAttempt,
  sameTaskIds,
  type LessonRetryAttempt,
} from "./lesson/attempt";
import type { TestTask } from "./test/api/test-queries";
import { isTaskAnswered } from "./test/taskAnswerUtils";

const LESSON_LANGUAGE_ID = 1;
const LESSON_MAX_TASKS = 3;

type LessonResultsState = {
  correctTasks: number;
  totalTasks: number;
  newTasks: TestTask[];
  languageId: number;
};

type AttemptBoot = {
  attempt: LessonRetryAttempt | null;
  storageError: string | null;
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

const toResultsState = (attempt: LessonRetryAttempt): LessonResultsState => ({
  correctTasks: attempt.correctTasks,
  totalTasks: attempt.totalTasks,
  newTasks: attempt.newTasks,
  languageId: attempt.languageId,
});

const readRetryAttempt = (data: LessonResultsState): AttemptBoot => {
  const stored = loadLessonRetryAttempt();
  if (!stored || !sameTaskIds(stored.newTasks, data.newTasks)) {
    return { attempt: null, storageError: null };
  }
  if (stored.pendingResult) {
    const ready =
      stored.status === "in_progress"
        ? stored
        : { ...stored, status: "in_progress" as const };
    if (ready === stored) {
      return { attempt: stored, storageError: null };
    }
    const saved = saveLessonRetryAttempt(ready);
    return {
      attempt: ready,
      storageError: saved ? null : ATTEMPT_STORAGE_SAVE_ERROR,
    };
  }
  if (stored.status === "submitting") {
    const interrupted = { ...stored, status: "interrupted" as const };
    const saved = saveLessonRetryAttempt(interrupted);
    return {
      attempt: interrupted,
      storageError: saved ? null : ATTEMPT_STORAGE_SAVE_ERROR,
    };
  }
  return { attempt: stored, storageError: null };
};

type LessonResultsContentProps = {
  data: LessonResultsState;
};

const LessonResultsContent = ({ data }: LessonResultsContentProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { correctTasks, totalTasks, newTasks, languageId } = data;
  const [boot] = useState(() => readRetryAttempt(data));
  const [retryAttempt, setRetryAttempt] = useState<LessonRetryAttempt | null>(
    boot.attempt,
  );
  const [storageError, setStorageError] = useState<string | null>(
    boot.storageError,
  );
  const [answersByTaskId, setAnswersByTaskId] = useState<
    Record<string, string>
  >(() => boot.attempt?.answersByTaskId ?? {});
  const [pendingResult, setPendingResult] =
    useState<LessonResultsResponse | null>(
      () => boot.attempt?.pendingResult ?? null,
    );
  const answersRef = useRef(answersByTaskId);
  answersRef.current = answersByTaskId;

  const {
    mutate: submitLessonResults,
    isPending: isSubmitPending,
    isError: isSubmitError,
    error: submitError,
  } = useSubmitLessonResultsMutation();

  const submissionInterrupted = retryAttempt?.status === "interrupted";
  const submitFailed = isSubmitError || retryAttempt?.status === "error";
  const answersLocked =
    isSubmitPending ||
    retryAttempt?.status === "submitting" ||
    submissionInterrupted ||
    pendingResult !== null;
  const lockRef = useRef(answersLocked);
  lockRef.current = answersLocked;

  useEffect(() => {
    const stored = loadLessonRetryAttempt();
    if (stored && sameTaskIds(stored.newTasks, newTasks)) {
      return;
    }
    const next: LessonRetryAttempt = {
      languageId,
      correctTasks,
      totalTasks,
      newTasks,
      answersByTaskId: {},
      status: "in_progress",
      pendingResult: null,
    };
    const saved = saveLessonRetryAttempt(next);
    setRetryAttempt(next);
    answersRef.current = {};
    setAnswersByTaskId({});
    setPendingResult(null);
    setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
  }, [languageId, correctTasks, totalTasks, newTasks]);

  const incorrectTasks = pendingResult?.incorrectTasksWithExplanations;

  const explanationByTaskId = useMemo(
    () => mapExplanationsByTaskId(incorrectTasks ?? []),
    [incorrectTasks],
  );

  const incorrectTaskIds = useMemo(
    () => new Set((incorrectTasks ?? []).map((task) => task.id)),
    [incorrectTasks],
  );

  const handleGoToResults = useCallback(() => {
    if (!pendingResult) {
      return;
    }
    const saved = saveLessonRetryAttempt({
      languageId,
      correctTasks: pendingResult.correctTasks,
      totalTasks: newTasks.length,
      newTasks: pendingResult.newTasks,
      answersByTaskId: {},
      status: "in_progress",
      pendingResult: null,
    });
    if (!saved) {
      setStorageError(ATTEMPT_STORAGE_SAVE_ERROR);
    }
    navigate("/lesson/result", {
      replace: true,
      state: {
        correctTasks: pendingResult.correctTasks,
        totalTasks: newTasks.length,
        newTasks: pendingResult.newTasks,
        languageId,
      },
    });
  }, [pendingResult, navigate, newTasks, languageId]);

  const handleAnswerValueChange = useCallback(
    (taskId: string, value: string) => {
      if (lockRef.current) {
        return;
      }
      const prev = answersRef.current;
      if (prev[taskId] === value) {
        return;
      }
      const nextAnswers = { ...prev, [taskId]: value };
      answersRef.current = nextAnswers;
      setAnswersByTaskId(nextAnswers);

      const current = loadLessonRetryAttempt();
      if (
        !current ||
        current.status === "submitting" ||
        current.status === "interrupted"
      ) {
        return;
      }
      const nextAttempt: LessonRetryAttempt = {
        ...current,
        answersByTaskId: nextAnswers,
        status: current.status === "error" ? "in_progress" : current.status,
      };
      const saved = saveLessonRetryAttempt(nextAttempt);
      setRetryAttempt(nextAttempt);
      setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
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
    if (lockRef.current || !allRetryAnswered || pendingResult) {
      return;
    }
    const current = loadLessonRetryAttempt();
    const snapshot = answersRef.current;
    const submitting: LessonRetryAttempt = {
      languageId,
      correctTasks: current?.correctTasks ?? correctTasks,
      totalTasks: current?.totalTasks ?? totalTasks,
      newTasks,
      answersByTaskId: snapshot,
      status: "submitting",
      pendingResult: null,
    };
    lockRef.current = true;
    const saved = saveLessonRetryAttempt(submitting);
    setRetryAttempt(submitting);
    setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
    submitLessonResults(
      {
        languageId,
        taskResults: newTasks.map((task) => ({
          taskId: task.id,
          userAnswer: snapshot[String(task.id)] ?? "",
        })),
      },
      {
        onSuccess: (response) => {
          const done: LessonRetryAttempt = {
            ...submitting,
            status: "in_progress",
            pendingResult: response,
          };
          const saved = saveLessonRetryAttempt(done);
          setRetryAttempt(done);
          setPendingResult(response);
          setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
        },
        onError: () => {
          lockRef.current = false;
          const failed: LessonRetryAttempt = {
            ...submitting,
            status: "error",
          };
          const saved = saveLessonRetryAttempt(failed);
          setRetryAttempt(failed);
          setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
        },
      },
    );
  };

  const handleNewLesson = () => {
    if (isSubmitPending || retryAttempt?.status === "submitting") {
      return;
    }
    const cleared = clearLessonAttempt() && clearLessonRetryAttempt();
    if (!cleared) {
      setStorageError(ATTEMPT_STORAGE_CLEAR_ERROR);
      return;
    }
    queryClient.removeQueries({
      queryKey: lessonTasksQueryKey(LESSON_LANGUAGE_ID, LESSON_MAX_TASKS),
    });
    navigate("/lesson", { replace: true });
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
                  answerValue={answersByTaskId[String(task.id)]}
                  explanation={explanationByTaskId[task.id]}
                  isIncorrect={incorrectTaskIds.has(task.id)}
                  disabled={answersLocked}
                  onAnswerValueChange={handleAnswerValueChange}
                />
              ))}
            </ol>
            <div className="mt-4 mb-2 flex flex-col items-end gap-2">
              {storageError ? (
                <p className="max-w-full text-right text-sm text-(--danger)">
                  {storageError}
                </p>
              ) : null}
              {submissionInterrupted && !pendingResult ? (
                <p className="max-w-full text-right text-sm text-(--danger)">
                  {ATTEMPT_INTERRUPTED_MESSAGE}
                </p>
              ) : null}
              {submitFailed && !pendingResult && !submissionInterrupted ? (
                <p className="max-w-full text-right text-sm text-(--danger)">
                  {submitError instanceof Error
                    ? submitError.message
                    : "Не удалось отправить результаты. Повторите отправку."}
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
              ) : submissionInterrupted ? (
                <Button
                  buttonType="button"
                  buttonName="Начать заново"
                  variant="ghost"
                  onClick={handleNewLesson}
                >
                  <ArrowRightLine />
                </Button>
              ) : (
                <Button
                  buttonType="button"
                  buttonName={
                    submitFailed ? "Повторить отправку" : "Завершить повтор"
                  }
                  variant="ghost"
                  isPending={
                    isSubmitPending || retryAttempt?.status === "submitting"
                  }
                  onClick={handleRetrySubmit}
                  disabled={answersLocked || !allRetryAnswered}
                >
                  <ArrowRightLine />
                </Button>
              )}
              {!pendingResult && !allRetryAnswered && !submissionInterrupted ? (
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
            {storageError ? (
              <p className="max-w-md text-sm text-(--danger)">{storageError}</p>
            ) : null}
            <Button
              buttonType="button"
              buttonName="Перейти на новый урок"
              variant="ghost"
              onClick={handleNewLesson}
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
  const location = useLocation();
  const { state } = location;
  const stored = loadLessonRetryAttempt();

  if (isLessonResultsState(state)) {
    return <LessonResultsContent key={location.key} data={state} />;
  }

  if (stored) {
    return (
      <LessonResultsContent
        key={`stored-${stored.newTasks.map((task) => task.id).join("-")}`}
        data={toResultsState(stored)}
      />
    );
  }

  return <Navigate to="/lesson" replace />;
};
