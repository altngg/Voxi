import { useCallback, useState } from "react";
import { Button } from "../shared/ui/Button";
import {
  ChooseOptionTask,
  type ChooseOptionItem,
} from "../widgets/ChooseOptionTask";
import {
  FillInTheBlanksTask,
  type FillInTheBlanksItem,
} from "../widgets/FillInTheBlanksTask";
import { ProgressBar } from "../widgets/ProgressBar";
import {
  TrueFalseTask,
  type TrueFalseTaskItem,
} from "../widgets/TrueFalseTask";
import { useTestTasksQuery, type TestTask } from "./test";

const BLANK_MARKER = "___";

const TASK_TYPE_ID = {
  MULTIPLE_CHOICE: "1",
  GAP_FILLING: "2",
  TRUE_FALSE: "3",
} as const;

const splitAtBlank = (text: string): { before: string; after: string } => {
  const i = text.indexOf(BLANK_MARKER);
  if (i === -1) {
    return { before: text, after: "" };
  }
  return {
    before: text.slice(0, i),
    after: text.slice(i + BLANK_MARKER.length),
  };
};

const toChooseOptionItem = (task: TestTask): ChooseOptionItem => {
  const { before, after } = splitAtBlank(task.name);
  const labels =
    task.options
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  return {
    id: String(task.id),
    before,
    after,
    options: labels.map((label, index) => ({
      id: `${task.id}-opt-${index}`,
      label,
    })),
  };
};

const toFillInTheBlanksItem = (task: TestTask): FillInTheBlanksItem => {
  const { before, after } = splitAtBlank(task.name);
  return {
    id: String(task.id),
    before,
    after,
  };
};

const toTrueFalseItem = (task: TestTask): TrueFalseTaskItem => ({
  id: String(task.id),
  statement: task.name,
});

const TaskByType = ({
  task,
  onAnsweredChange,
}: {
  task: TestTask;
  onAnsweredChange?: (taskId: string, answered: boolean) => void;
}) => {
  const taskId = String(task.id);

  switch (task.taskType) {
    case TASK_TYPE_ID.MULTIPLE_CHOICE:
      return (
        <ChooseOptionTask
          title="Выберите правильный ответ"
          items={[toChooseOptionItem(task)]}
          onAnswersChange={(answers) => {
            onAnsweredChange?.(taskId, Boolean(answers[taskId]?.trim()));
          }}
        />
      );
    case TASK_TYPE_ID.GAP_FILLING:
      return (
        <FillInTheBlanksTask
          title="Заполните пропуски"
          items={[toFillInTheBlanksItem(task)]}
          onAnswersChange={(answers) => {
            onAnsweredChange?.(taskId, Boolean(answers[taskId]?.trim()));
          }}
        />
      );
    case TASK_TYPE_ID.TRUE_FALSE:
      return (
        <TrueFalseTask
          title="Выберите правильный ответ"
          items={[toTrueFalseItem(task)]}
          onAnswersChange={(answers) => {
            onAnsweredChange?.(taskId, Object.hasOwn(answers, taskId));
          }}
        />
      );
    default:
      return (
        <p className="text-base text-(--danger)">
          Неизвестный тип задания: {task.taskType}
        </p>
      );
  }
};

export const TestPage = () => {
  const { data, isPending, error } = useTestTasksQuery({
    languageId: 1,
    count: 5,
  });

  const tasks = data?.tasks ?? [];
  const [answeredTaskIds, setAnsweredTaskIds] = useState<Set<string>>(
    () => new Set(),
  );

  const handleAnsweredChange = useCallback(
    (taskId: string, answered: boolean) => {
      setAnsweredTaskIds((prev) => {
        const has = prev.has(taskId);
        if (answered === has) {
          return prev;
        }
        const next = new Set(prev);
        if (answered) {
          next.add(taskId);
        } else {
          next.delete(taskId);
        }
        return next;
      });
    },
    [],
  );

  const totalQuestions = tasks.length || 5;

  return (
    <main className="box-border h-full min-h-0 overflow-y-auto pb-4 pt-0 sm:px-6">
      <div className="h-4 shrink-0" aria-hidden />
      <section className="mx-auto min-h-[calc(100dvh-2rem)] w-full max-w-6xl rounded-3xl border-4 border-(--default-border) px-4 py-2">
        <div className="sticky top-0 z-30 -mx-4 mb-4 bg-(--bg-canvas) px-4 pb-4 pt-0 rounded-t-3xl">
          <ProgressBar
            totalQuestions={totalQuestions}
            completedQuestions={answeredTaskIds.size}
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
                    onAnsweredChange={handleAnsweredChange}
                  />
                </li>
              ))}
            </ol>
          ) : null}
        </section>
        <div className="mt-4 mb-2 flex justify-end">
          <Button
            buttonType="submit"
            buttonName="Далее"
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
