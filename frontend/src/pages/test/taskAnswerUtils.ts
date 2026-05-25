import type { TestTask } from "./api/test-queries";

export const BLANK_MARKER = "___";

export const TASK_TYPE_ID = {
  MULTIPLE_CHOICE: "1",
  GAP_FILLING: "2",
  TRUE_FALSE: "3",
} as const;

export type TaskTypeKey = keyof typeof TASK_TYPE_ID;

const TASK_TYPE_BY_ID: Record<string, TaskTypeKey> = {
  [TASK_TYPE_ID.MULTIPLE_CHOICE]: "MULTIPLE_CHOICE",
  [TASK_TYPE_ID.GAP_FILLING]: "GAP_FILLING",
  [TASK_TYPE_ID.TRUE_FALSE]: "TRUE_FALSE",
};

export const normalizeTaskType = (taskType: string): TaskTypeKey | null => {
  const trimmed = taskType.trim();
  if (trimmed in TASK_TYPE_BY_ID) {
    return TASK_TYPE_BY_ID[trimmed];
  }
  const upper = trimmed.toUpperCase();
  if (upper in TASK_TYPE_ID) {
    return upper as TaskTypeKey;
  }
  return null;
};

export const isTaskAnswered = (task: TestTask, answer: string | undefined) => {
  if (answer === undefined) {
    return false;
  }
  switch (normalizeTaskType(task.taskType)) {
    case "MULTIPLE_CHOICE":
      return Boolean(answer);
    case "GAP_FILLING":
      return Boolean(answer.trim());
    case "TRUE_FALSE":
      return answer === "true" || answer === "false";
    default:
      return false;
  }
};
