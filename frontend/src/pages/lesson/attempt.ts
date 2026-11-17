import type { LessonResultsResponse } from "../../shared/api/lesson-result";
import {
  ATTEMPT_KEYS,
  clearAttempt,
  isAttemptStatus,
  isFiniteNumber,
  isStoredTaskList,
  isStringRecord,
  loadAttempt,
  saveAttempt,
  type AttemptStatus,
} from "../../shared/lib/attempt-storage";
import type { TestTask } from "../test/api/test-queries";
import type { LessonTask, LessonTasksResponse } from "./api/lesson-tasks";

export type LessonAttempt = {
  languageId: number;
  language: string;
  tasks: LessonTask[];
  answersByTaskId: Record<string, string>;
  status: AttemptStatus;
  pendingResult: LessonResultsResponse | null;
};

export type LessonRetryAttempt = {
  languageId: number;
  correctTasks: number;
  totalTasks: number;
  newTasks: TestTask[];
  answersByTaskId: Record<string, string>;
  status: AttemptStatus;
  pendingResult: LessonResultsResponse | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isLessonResultsResponse = (
  value: unknown,
): value is LessonResultsResponse => {
  if (!isRecord(value) || !isFiniteNumber(value.correctTasks)) {
    return false;
  }
  if (!Array.isArray(value.incorrectTasksWithExplanations)) {
    return false;
  }
  const explanationsOk = value.incorrectTasksWithExplanations.every(
    (item) =>
      isRecord(item) &&
      isFiniteNumber(item.id) &&
      typeof item.explanation === "string",
  );
  return explanationsOk && isStoredTaskList(value.newTasks);
};

const toLessonResultsResponse = (
  value: LessonResultsResponse,
): LessonResultsResponse => ({
  correctTasks: value.correctTasks,
  incorrectTasksWithExplanations: value.incorrectTasksWithExplanations.map(
    (item) => ({
      id: item.id,
      explanation: item.explanation,
    }),
  ),
  newTasks: value.newTasks.map((task) => ({
    id: task.id,
    name: task.name,
    topic: task.topic,
    taskType: task.taskType,
    options: task.options,
  })),
});

export const parseLessonAttempt = (value: unknown): LessonAttempt | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (
    !isFiniteNumber(value.languageId) ||
    typeof value.language !== "string" ||
    !isStoredTaskList(value.tasks) ||
    !isStringRecord(value.answersByTaskId) ||
    !isAttemptStatus(value.status) ||
    (value.pendingResult !== null &&
      !isLessonResultsResponse(value.pendingResult))
  ) {
    return null;
  }

  return {
    languageId: value.languageId,
    language: value.language,
    tasks: value.tasks,
    answersByTaskId: value.answersByTaskId,
    status: value.status,
    pendingResult:
      value.pendingResult === null
        ? null
        : toLessonResultsResponse(value.pendingResult),
  };
};

export const parseLessonRetryAttempt = (
  value: unknown,
): LessonRetryAttempt | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (
    !isFiniteNumber(value.languageId) ||
    !isFiniteNumber(value.correctTasks) ||
    !isFiniteNumber(value.totalTasks) ||
    !isStoredTaskList(value.newTasks) ||
    !isStringRecord(value.answersByTaskId) ||
    !isAttemptStatus(value.status) ||
    (value.pendingResult !== null &&
      !isLessonResultsResponse(value.pendingResult))
  ) {
    return null;
  }

  return {
    languageId: value.languageId,
    correctTasks: value.correctTasks,
    totalTasks: value.totalTasks,
    newTasks: value.newTasks,
    answersByTaskId: value.answersByTaskId,
    status: value.status,
    pendingResult:
      value.pendingResult === null
        ? null
        : toLessonResultsResponse(value.pendingResult),
  };
};

export const loadLessonAttempt = () =>
  loadAttempt(ATTEMPT_KEYS.lesson, parseLessonAttempt);

export const saveLessonAttempt = (attempt: LessonAttempt) =>
  saveAttempt(ATTEMPT_KEYS.lesson, attempt);

export const clearLessonAttempt = () => clearAttempt(ATTEMPT_KEYS.lesson);

export const loadLessonRetryAttempt = () =>
  loadAttempt(ATTEMPT_KEYS.lessonRetry, parseLessonRetryAttempt);

export const saveLessonRetryAttempt = (attempt: LessonRetryAttempt) =>
  saveAttempt(ATTEMPT_KEYS.lessonRetry, attempt);

export const clearLessonRetryAttempt = () =>
  clearAttempt(ATTEMPT_KEYS.lessonRetry);

export const toLessonTasksResponse = (
  attempt: LessonAttempt,
): LessonTasksResponse => ({
  language: attempt.language,
  tasks: attempt.tasks,
});

const taskIdOf = (task: { id?: number } | null | undefined) =>
  task && isFiniteNumber(task.id) ? task.id : null;

export const sameTaskIds = (
  left: { id: number }[],
  right: { id: number }[],
) =>
  Array.isArray(left) &&
  Array.isArray(right) &&
  left.length === right.length &&
  left.every((task, index) => {
    const id = taskIdOf(task);
    return id !== null && id === taskIdOf(right[index]);
  });
