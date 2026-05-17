import { useCallback, useState } from "react";
import { Button } from "../shared/ui/Button";
import { ProgressBar } from "../widgets/ProgressBar";
import { useTestTasksQuery } from "./test";
import { TaskByType } from "./test/TaskByType";
import { isTaskAnswered } from "./test/taskAnswerUtils";
import type { TestTask } from "./test/api/test-queries";

/**
 * Тексты теории по id задания. Когда появится поле в API, подставьте его сюда или уберите карту.
 */
const THEORY_BY_TASK_ID: Partial<Record<number, string>> = {};

type LessonTaskRowProps = {
  task: TestTask;
  theory?: string;
  onAnswerValueChange?: (taskId: string, value: string) => void;
};

const LessonTaskRow = ({
  task,
  theory,
  onAnswerValueChange,
}: LessonTaskRowProps) => {
  return (
    <li className="rounded-[20px] border-2 border-(--default-border) p-4">
      {theory ? (
        <details className="mb-4 rounded-2xl border border-(--default-border) bg-(--bg-primary) px-4 py-3 open:pb-4">
          <summary className="cursor-pointer list-none text-base font-medium text-(--text-primary) [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full bg-(--accent-primary)"
                aria-hidden
              />
              Теория к заданию
            </span>
          </summary>
          <div className="mt-3 whitespace-pre-wrap border-t border-(--default-border) pt-3 text-base leading-relaxed text-(--text-primary)">
            {theory}
          </div>
        </details>
      ) : null}
      <TaskByType task={task} onAnswerValueChange={onAnswerValueChange} />
    </li>
  );
};

export const LessonPage = () => {
  const { data, isPending, error } = useTestTasksQuery({
    languageId: 1,
    count: 5,
  });

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

  const totalQuestions = tasks.length || 5;
  const allAnswered =
    tasks.length > 0 &&
    tasks.every((task) =>
      isTaskAnswered(task, answersByTaskId[String(task.id)]),
    );

  const [lessonDone, setLessonDone] = useState(false);

  const handleFinishLesson = () => {
    if (!allAnswered) {
      return;
    }
    setLessonDone(true);
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
          <h2 className="mb-1 text-lg font-medium">Урок</h2>
          <p className="mb-3 text-base text-(--text-primary) opacity-80">
            Пройдите задания. Перед вопросом может отображаться блок с теорией.
          </p>
          {lessonDone ? (
            <p
              className="mb-3 rounded-2xl border border-(--accent-primary) bg-(--bg-primary) px-4 py-3 text-base text-(--text-primary)"
              role="status"
            >
              Урок завершён. Можете перейти к другим разделам в меню.
            </p>
          ) : null}
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
                  theory={THEORY_BY_TASK_ID[task.id]}
                  onAnswerValueChange={handleAnswerValueChange}
                />
              ))}
            </ol>
          ) : null}
        </section>
        <div className="mt-4 mb-2 flex flex-col items-end gap-2">
          <Button
            buttonType="button"
            buttonName="Завершить урок"
            onClick={handleFinishLesson}
            disabled={
              lessonDone ||
              !allAnswered ||
              isPending ||
              Boolean(error) ||
              tasks.length === 0
            }
            className="bg-transparent text-(--text-primary) hover:bg-(--bg-primary) hover:text-(--bg-canvas) disabled:opacity-50"
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
          {!lessonDone && !allAnswered && tasks.length > 0 ? (
            <p className="max-w-full text-right text-sm opacity-70">
              Ответьте на все задания, чтобы завершить урок.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
};
