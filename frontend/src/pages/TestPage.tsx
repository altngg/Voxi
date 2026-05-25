import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../shared/ui/Button";
import { ProgressBar } from "../widgets/ProgressBar";
import { ArrowRightLine } from "../shared/ui/icons/ArrowRightLine";
import { useSubmitTestResultMutation, useTestTasksQuery } from "./test";
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
                <li key={task.id} className="ui-card-inset p-4">
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
            variant="ghost"
            isPending={isSubmitPending}
            onClick={handleSubmitResults}
            disabled={isPending || Boolean(error) || tasks.length === 0}
          >
            <ArrowRightLine />
          </Button>
        </div>
      </section>
    </main>
  );
};
