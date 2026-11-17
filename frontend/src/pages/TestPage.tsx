import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ATTEMPT_INTERRUPTED_MESSAGE,
  ATTEMPT_STORAGE_CLEAR_ERROR,
  ATTEMPT_STORAGE_SAVE_ERROR,
} from "../shared/lib/attempt-storage";
import { Button } from "../shared/ui/Button";
import { ProgressBar } from "../widgets/ProgressBar";
import { ArrowRightLine } from "../shared/ui/icons/ArrowRightLine";
import {
  testTasksQueryKey,
  useSubmitTestResultMutation,
  useTestTasksQuery,
} from "./test";
import {
  clearTestAttempt,
  loadTestAttempt,
  saveTestAttempt,
  toTestTasksResponse,
  type TestAttempt,
} from "./test/attempt";
import { TaskByType } from "./test/TaskByType";
import { isTaskAnswered } from "./test/taskAnswerUtils";

const TEST_LANGUAGE_ID = 1;
const TEST_TASK_COUNT = 5;

type AttemptBoot = {
  attempt: TestAttempt | null;
  storageError: string | null;
};

const readInitialAttempt = (): AttemptBoot => {
  const stored = loadTestAttempt();
  if (!stored) {
    return { attempt: null, storageError: null };
  }
  if (stored.status !== "submitting") {
    return { attempt: stored, storageError: null };
  }
  const interrupted = { ...stored, status: "interrupted" as const };
  const saved = saveTestAttempt(interrupted);
  return {
    attempt: interrupted,
    storageError: saved ? null : ATTEMPT_STORAGE_SAVE_ERROR,
  };
};

export const TestPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [boot] = useState(readInitialAttempt);
  const [attempt, setAttempt] = useState<TestAttempt | null>(boot.attempt);
  const [storageError, setStorageError] = useState<string | null>(
    boot.storageError,
  );

  const restored =
    attempt && attempt.tasks.length > 0 ? toTestTasksResponse(attempt) : null;
  const { data, isPending, error } = useTestTasksQuery({
    languageId: TEST_LANGUAGE_ID,
    count: TEST_TASK_COUNT,
    restored,
  });

  const {
    mutate: submitTestResults,
    isPending: isSubmitPending,
    isError: isSubmitError,
    error: submitError,
    reset: resetSubmit,
  } = useSubmitTestResultMutation();

  const tasks = data?.tasks ?? attempt?.tasks ?? [];
  const [answersByTaskId, setAnswersByTaskId] = useState<
    Record<string, string>
  >(() => attempt?.answersByTaskId ?? {});
  const answersRef = useRef(answersByTaskId);
  answersRef.current = answersByTaskId;
  const submissionInterrupted = attempt?.status === "interrupted";
  const submitFailed = isSubmitError || attempt?.status === "error";
  const answersLocked =
    isSubmitPending ||
    attempt?.status === "submitting" ||
    submissionInterrupted;
  const lockRef = useRef(answersLocked);
  lockRef.current = answersLocked;

  useEffect(() => {
    if (attempt || !data?.tasks.length || data.testId === undefined) {
      return;
    }
    const next: TestAttempt = {
      testId: data.testId,
      languageId: TEST_LANGUAGE_ID,
      language: data.language,
      totalTimeMinutes: data.totalTimeMinutes,
      tasks: data.tasks,
      answersByTaskId,
      status: "in_progress",
    };
    const saved = saveTestAttempt(next);
    setAttempt(next);
    setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
  }, [attempt, data, answersByTaskId]);

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

    const current = loadTestAttempt();
    if (
      !current ||
      current.status === "submitting" ||
      current.status === "interrupted"
    ) {
      return;
    }
    const nextAttempt: TestAttempt = {
      ...current,
      answersByTaskId: nextAnswers,
      status: current.status === "error" ? "in_progress" : current.status,
    };
    const saved = saveTestAttempt(nextAttempt);
    setAttempt(nextAttempt);
    setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
  }, []);

  const completedQuestions = tasks.filter((task) =>
    isTaskAnswered(task, answersByTaskId[String(task.id)]),
  ).length;

  const handleSubmitResults = () => {
    if (lockRef.current) {
      return;
    }
    const current = loadTestAttempt();
    const testId = current?.testId ?? data?.testId;
    const taskList = tasks.length > 0 ? tasks : (current?.tasks ?? []);
    if (testId === undefined || taskList.length === 0) {
      return;
    }
    const snapshot = answersRef.current;
    const submitting: TestAttempt = {
      testId,
      languageId: TEST_LANGUAGE_ID,
      language: current?.language ?? data?.language ?? "",
      totalTimeMinutes:
        current?.totalTimeMinutes ?? data?.totalTimeMinutes ?? 0,
      tasks: taskList,
      answersByTaskId: snapshot,
      status: "submitting",
    };
    lockRef.current = true;
    const saved = saveTestAttempt(submitting);
    setAttempt(submitting);
    setStorageError(saved ? null : ATTEMPT_STORAGE_SAVE_ERROR);
    submitTestResults(
      {
        testId,
        taskResults: taskList.map((task) => ({
          taskId: task.id,
          userAnswer: snapshot[String(task.id)] ?? "",
        })),
      },
      {
        onSuccess: (response) => {
          clearTestAttempt();
          navigate("/test/result", {
            replace: true,
            state: {
              overallLevel: response.overallLevel,
              grammarScore: response.grammarScore,
              vocabularyScore: response.vocabularyScore,
            },
          });
        },
        onError: () => {
          lockRef.current = false;
          const failed: TestAttempt = { ...submitting, status: "error" };
          const saved = saveTestAttempt(failed);
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
    if (!clearTestAttempt()) {
      setStorageError(ATTEMPT_STORAGE_CLEAR_ERROR);
      return;
    }
    lockRef.current = false;
    setStorageError(null);
    setAttempt(null);
    answersRef.current = {};
    setAnswersByTaskId({});
    queryClient.removeQueries({
      queryKey: testTasksQueryKey(TEST_LANGUAGE_ID, TEST_TASK_COUNT),
    });
  };

  const totalQuestions = tasks.length || TEST_TASK_COUNT;

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
          <h2 className="ui-section-title mb-2">Задания теста</h2>
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
                <li key={task.id} className="ui-card-inset p-4">
                  <TaskByType
                    task={task}
                    answerValue={answersByTaskId[String(task.id)]}
                    disabled={answersLocked}
                    onAnswerValueChange={handleAnswerValueChange}
                  />
                </li>
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
          {submissionInterrupted ? (
            <p className="max-w-full text-right text-sm text-(--danger)">
              {ATTEMPT_INTERRUPTED_MESSAGE}
            </p>
          ) : null}
          {submitFailed && !submissionInterrupted ? (
            <p className="max-w-full text-right text-sm text-(--danger)">
              {submitError instanceof Error
                ? submitError.message
                : "Не удалось отправить результаты. Повторите отправку."}
            </p>
          ) : null}
          {submissionInterrupted ? null : (
            <Button
              buttonType="button"
              buttonName={submitFailed ? "Повторить отправку" : "Далее"}
              variant="ghost"
              isPending={isSubmitPending || attempt?.status === "submitting"}
              onClick={handleSubmitResults}
              disabled={
                answersLocked ||
                (!restored && (isPending || Boolean(error))) ||
                tasks.length === 0
              }
            >
              <ArrowRightLine />
            </Button>
          )}
          {tasks.length > 0 &&
          !isSubmitPending &&
          attempt?.status !== "submitting" ? (
            <Button
              buttonType="button"
              buttonName="Начать тест заново"
              variant="ghost"
              onClick={handleStartOver}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
};
