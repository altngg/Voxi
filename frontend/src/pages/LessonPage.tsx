import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { LessonResultsResponse } from "../shared/api/lesson-result";
import {
  ATTEMPT_INTERRUPTED_MESSAGE,
  ATTEMPT_STORAGE_CLEAR_ERROR,
  ATTEMPT_STORAGE_SAVE_ERROR,
} from "../shared/lib/attempt-storage";
import { Button } from "../shared/ui/Button";
import { ArrowRightLine } from "../shared/ui/icons/ArrowRightLine";
import { LessonTaskRow } from "../widgets/LessonTaskRow";
import { ProgressBar } from "../widgets/ProgressBar";
import {
  lessonTasksQueryKey,
  mapExplanationsByTaskId,
  useLessonTasksQuery,
  useSubmitLessonResultsMutation,
} from "./lesson";
import {
  clearLessonAttempt,
  clearLessonRetryAttempt,
  loadLessonAttempt,
  saveLessonAttempt,
  saveLessonRetryAttempt,
  toLessonTasksResponse,
  type LessonAttempt,
} from "./lesson/attempt";
import { isTaskAnswered } from "./test/taskAnswerUtils";

const LESSON_LANGUAGE_ID = 1;
const LESSON_MAX_TASKS = 3;

type AttemptBoot = {
  attempt: LessonAttempt | null;
  storageError: string | null;
};

const readInitialAttempt = (): AttemptBoot => {
  const stored = loadLessonAttempt();
  if (!stored) {
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
    const saved = saveLessonAttempt(ready);
    return {
      attempt: ready,
      storageError: saved ? null : ATTEMPT_STORAGE_SAVE_ERROR,
    };
  }
  if (stored.status === "submitting") {
    const interrupted = { ...stored, status: "interrupted" as const };
    const saved = saveLessonAttempt(interrupted);
    return {
      attempt: interrupted,
      storageError: saved ? null : ATTEMPT_STORAGE_SAVE_ERROR,
    };
  }
  return { attempt: stored, storageError: null };
};

export const LessonPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [boot] = useState(readInitialAttempt);
  const [attempt, setAttempt] = useState<LessonAttempt | null>(boot.attempt);
  const [storageError, setStorageError] = useState<string | null>(
    boot.storageError,
  );

  const restored =
    attempt && attempt.tasks.length > 0 ? toLessonTasksResponse(attempt) : null;
  const { data, isPending, error } = useLessonTasksQuery({
    languageId: LESSON_LANGUAGE_ID,
    maxTasks: LESSON_MAX_TASKS,
    restored,
  });

  const tasks = data?.tasks ?? attempt?.tasks ?? [];
  const [answersByTaskId, setAnswersByTaskId] = useState<
    Record<string, string>
  >(() => attempt?.answersByTaskId ?? {});
  const [pendingResult, setPendingResult] =
    useState<LessonResultsResponse | null>(() => attempt?.pendingResult ?? null);
  const answersRef = useRef(answersByTaskId);
  answersRef.current = answersByTaskId;

  const {
    mutate: submitLessonResults,
    isPending: isSubmitPending,
    isError: isSubmitError,
    error: submitError,
    reset: resetSubmit,
  } = useSubmitLessonResultsMutation();

  const submissionInterrupted = attempt?.status === "interrupted";
  const submitFailed = isSubmitError || attempt?.status === "error";
  const answersLocked =
    isSubmitPending ||
    attempt?.status === "submitting" ||
    submissionInterrupted ||
    pendingResult !== null;
  const lockRef = useRef(answersLocked);
  lockRef.current = answersLocked;

  useEffect(() => {
    if (attempt || !data?.tasks.length) {
      return;
    }
    const next: LessonAttempt = {
      languageId: LESSON_LANGUAGE_ID,
      language: data.language,
      tasks: data.tasks,
      answersByTaskId,
      status: "in_progress",
      pendingResult: null,
    };
    const saved = saveLessonAttempt(next);
    setAttempt(next);
    setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
  }, [attempt, data, answersByTaskId]);

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
      languageId: LESSON_LANGUAGE_ID,
      correctTasks: pendingResult.correctTasks,
      totalTasks: tasks.length,
      newTasks: pendingResult.newTasks,
      answersByTaskId: {},
      status: "in_progress",
      pendingResult: null,
    });
    if (!saved) {
      setStorageError(ATTEMPT_STORAGE_SAVE_ERROR);
    }
    clearLessonAttempt();
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

  const handleAnswerValueChange = useCallback((taskId: string, value: string) => {
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

    const current = loadLessonAttempt();
    if (
      !current ||
      current.status === "submitting" ||
      current.status === "interrupted"
    ) {
      return;
    }
    const nextAttempt: LessonAttempt = {
      ...current,
      answersByTaskId: nextAnswers,
      status: current.status === "error" ? "in_progress" : current.status,
    };
    const saved = saveLessonAttempt(nextAttempt);
    setAttempt(nextAttempt);
    setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
  }, []);

  const completedQuestions = tasks.filter((task) =>
    isTaskAnswered(task, answersByTaskId[String(task.id)]),
  ).length;

  const totalQuestions = tasks.length || LESSON_MAX_TASKS;
  const allAnswered =
    tasks.length > 0 &&
    tasks.every((task) =>
      isTaskAnswered(task, answersByTaskId[String(task.id)]),
    );

  const handleFinishLesson = () => {
    if (lockRef.current || !allAnswered || pendingResult) {
      return;
    }
    const current = loadLessonAttempt();
    const snapshot = answersRef.current;
    const submitting: LessonAttempt = {
      languageId: LESSON_LANGUAGE_ID,
      language: current?.language ?? data?.language ?? "",
      tasks,
      answersByTaskId: snapshot,
      status: "submitting",
      pendingResult: null,
    };
    lockRef.current = true;
    const saved = saveLessonAttempt(submitting);
    setAttempt(submitting);
    setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
    submitLessonResults(
      {
        languageId: LESSON_LANGUAGE_ID,
        taskResults: tasks.map((task) => ({
          taskId: task.id,
          userAnswer: snapshot[String(task.id)] ?? "",
        })),
      },
      {
        onSuccess: (response) => {
          const done: LessonAttempt = {
            ...submitting,
            status: "in_progress",
            pendingResult: response,
          };
          const saved = saveLessonAttempt(done);
          setAttempt(done);
          setPendingResult(response);
          setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
        },
        onError: () => {
          lockRef.current = false;
          const failed: LessonAttempt = { ...submitting, status: "error" };
          const saved = saveLessonAttempt(failed);
          setAttempt(failed);
          setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
        },
      },
    );
  };

  const handleStartOver = () => {
    if (isSubmitPending || attempt?.status === "submitting") {
      return;
    }
    resetSubmit();
    const cleared = clearLessonAttempt() && clearLessonRetryAttempt();
    if (!cleared) {
      setStorageError(ATTEMPT_STORAGE_CLEAR_ERROR);
      return;
    }
    lockRef.current = false;
    setStorageError(null);
    setAttempt(null);
    answersRef.current = {};
    setAnswersByTaskId({});
    setPendingResult(null);
    queryClient.removeQueries({
      queryKey: lessonTasksQueryKey(LESSON_LANGUAGE_ID, LESSON_MAX_TASKS),
    });
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
          {isPending && !restored ? (
            <p className="text-base text-(--text-secondary)">
              Загружаем задания...
            </p>
          ) : null}
          {error && !restored ? (
            <p className="text-base text-(--danger)">
              {error instanceof Error
                ? error.message
                : "Не удалось загрузить задания"}
            </p>
          ) : null}
          {(!isPending && !error) || restored ? (
            <ol className="space-y-3 text-lg">
              {tasks.map((task) => (
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
          ) : null}
        </section>
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
          ) : submissionInterrupted ? null : (
            <Button
              buttonType="button"
              buttonName={
                submitFailed ? "Повторить отправку" : "Завершить урок"
              }
              variant="ghost"
              isPending={isSubmitPending || attempt?.status === "submitting"}
              onClick={handleFinishLesson}
              disabled={
                answersLocked ||
                !allAnswered ||
                (!restored && (isPending || Boolean(error))) ||
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
          {tasks.length > 0 &&
          !isSubmitPending &&
          attempt?.status !== "submitting" ? (
            <Button
              buttonType="button"
              buttonName="Начать урок заново"
              variant="ghost"
              onClick={handleStartOver}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
};
