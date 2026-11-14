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
import type { TestTask, TestTasksResponse } from "./api/test-queries";

export type TestAttempt = {
  testId: number;
  languageId: number;
  language: string;
  totalTimeMinutes: number;
  tasks: TestTask[];
  answersByTaskId: Record<string, string>;
  status: AttemptStatus;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseTestAttempt = (value: unknown): TestAttempt | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (
    !isFiniteNumber(value.testId) ||
    !isFiniteNumber(value.languageId) ||
    typeof value.language !== "string" ||
    !isFiniteNumber(value.totalTimeMinutes) ||
    !isStoredTaskList(value.tasks) ||
    !isStringRecord(value.answersByTaskId) ||
    !isAttemptStatus(value.status)
  ) {
    return null;
  }

  return {
    testId: value.testId,
    languageId: value.languageId,
    language: value.language,
    totalTimeMinutes: value.totalTimeMinutes,
    tasks: value.tasks,
    answersByTaskId: value.answersByTaskId,
    status: value.status,
  };
};

export const loadTestAttempt = () =>
  loadAttempt(ATTEMPT_KEYS.test, parseTestAttempt);

export const saveTestAttempt = (attempt: TestAttempt) =>
  saveAttempt(ATTEMPT_KEYS.test, attempt);

export const clearTestAttempt = () => clearAttempt(ATTEMPT_KEYS.test);

export const toTestTasksResponse = (
  attempt: TestAttempt,
): TestTasksResponse => ({
  testId: attempt.testId,
  language: attempt.language,
  tasks: attempt.tasks,
  totalTimeMinutes: attempt.totalTimeMinutes,
});
