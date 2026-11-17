import type { IncorrectTaskWithExplanation } from "../../shared/api/lesson-result";

export const mapExplanationsByTaskId = (
  tasks: IncorrectTaskWithExplanation[],
): Partial<Record<number, string>> => {
  const map: Partial<Record<number, string>> = {};
  for (const task of tasks) {
    if (task.explanation) {
      map[task.id] = task.explanation;
    }
  }
  return map;
};
