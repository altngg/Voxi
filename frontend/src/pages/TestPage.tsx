import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../shared/ui/Button";
import { ProgressBar } from "../widgets/ProgressBar";
import {
  useSubmitTestResultMutation,
  useTestTasksQuery,
} from "./test";
import { TaskByType } from "./test/TaskByType";
import { isTaskAnswered } from "./test/taskAnswerUtils";

export const TestPage = () => {
  const navigate = useNavigate();

  const { data, isPending, error } = useTestTasksQuery({
    languageId: 1,
    count: 5,
  });

  const {
    mutate: submitTestResults,
    isPending: isSubmitPending,
    isError: isSubmitError,
    error: submitError,
  } = useSubmitTestResultMutation();

  const tasks = data?.tasks ?? [];
  const [answersByTaskId, setAnswersByTaskId] = useState<
    Record<string, string>
  >({});

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

  const handleSubmitResults = () => {
    const testId = data?.testId;
    const taskList = data?.tasks ?? [];
    if (testId === undefined || taskList.length === 0) {
      return;
    }
    submitTestResults(
      {
        testId,
        taskResults: taskList.map((task) => ({
          taskId: task.id,
          userAnswer: answersByTaskId[String(task.id)] ?? "",
        })),
      },
      {
        onSuccess: (response) => {
          navigate("/test/result", {
            replace: true,
            state: {
              overallLevel: response.overallLevel,
              grammarScore: response.grammarScore,
              vocabularyScore: response.vocabularyScore,
            },
          });
        },
      },
    );
  };

  const totalQuestions = tasks.length || 5;

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
          <h2 className="mb-2 text-lg font-medium">Задания теста</h2>
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
                <li
                  key={task.id}
                  className="rounded-[20px] border-2 border-(--default-border) p-4"
                >
                  <TaskByType
                    task={task}
                    onAnswerValueChange={handleAnswerValueChange}
                  />
                </li>
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
          <Button
            buttonType="button"
            buttonName="Далее"
            isPending={isSubmitPending}
            onClick={handleSubmitResults}
            disabled={isPending || Boolean(error) || tasks.length === 0}
            className="bg-transparent text-(--text-primary) hover:bg-(--bg-primary) hover:text-(--bg-canvas)"
          >
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
          </Button>
        </div>
      </section>
    </main>
  );
};
