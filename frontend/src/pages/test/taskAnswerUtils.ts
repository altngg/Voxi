import type { TestTask } from "./api/test-queries";

export const BLANK_MARKER = "___";

export const TASK_TYPE_ID = {
  MULTIPLE_CHOICE: "1",
  GAP_FILLING: "2",
  TRUE_FALSE: "3",
} as const;

export const isTaskAnswered = (task: TestTask, answer: string | undefined) => {
  if (answer === undefined) {
    return false;
  }
  switch (task.taskType) {
    case TASK_TYPE_ID.MULTIPLE_CHOICE:
      return Boolean(answer);
    case TASK_TYPE_ID.GAP_FILLING:
      return Boolean(answer.trim());
    case TASK_TYPE_ID.TRUE_FALSE:
      return answer === "true" || answer === "false";
    default:
      return false;
  }
};
