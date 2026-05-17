import {
  ChooseOptionTask,
  type ChooseOptionItem,
} from "../../widgets/ChooseOptionTask";
import {
  FillInTheBlanksTask,
  type FillInTheBlanksItem,
} from "../../widgets/FillInTheBlanksTask";
import { TrueFalseTask, type TrueFalseTaskItem } from "../../widgets/TrueFalseTask";
import type { TestTask } from "./api/test-queries";
import { BLANK_MARKER, TASK_TYPE_ID } from "./taskAnswerUtils";

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

export const TaskByType = ({
  task,
  onAnswerValueChange,
}: {
  task: TestTask;
  onAnswerValueChange?: (taskId: string, value: string) => void;
}) => {
  const taskId = String(task.id);

  switch (task.taskType) {
    case TASK_TYPE_ID.MULTIPLE_CHOICE: {
      const chooseItem = toChooseOptionItem(task);
      return (
        <ChooseOptionTask
          title="Выберите правильный ответ"
          items={[chooseItem]}
          onAnswersChange={(answers) => {
            const optionId = answers[taskId] ?? "";
            const label =
              chooseItem.options.find((o) => o.id === optionId)?.label ?? "";
            onAnswerValueChange?.(taskId, label);
          }}
        />
      );
    }
    case TASK_TYPE_ID.GAP_FILLING:
      return (
        <FillInTheBlanksTask
          title="Заполните пропуски"
          items={[toFillInTheBlanksItem(task)]}
          onAnswersChange={(answers) => {
            const text = answers[taskId] ?? "";
            onAnswerValueChange?.(taskId, text);
          }}
        />
      );
    case TASK_TYPE_ID.TRUE_FALSE:
      return (
        <TrueFalseTask
          title="Выберите правильный ответ"
          items={[toTrueFalseItem(task)]}
          onAnswersChange={(answers) => {
            if (!Object.hasOwn(answers, taskId)) {
              onAnswerValueChange?.(taskId, "");
              return;
            }
            const bool = answers[taskId];
            onAnswerValueChange?.(taskId, bool ? "true" : "false");
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
