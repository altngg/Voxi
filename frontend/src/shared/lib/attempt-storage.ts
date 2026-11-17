export const ATTEMPT_KEYS = {
  test: "voxi:test-attempt",
  lesson: "voxi:lesson-attempt",
  lessonRetry: "voxi:lesson-retry-attempt",
} as const;

export const ATTEMPT_STORAGE_SAVE_ERROR =
  "Не удалось сохранить прогресс в браузере. После обновления страницы ответы могут пропасть.";

export const ATTEMPT_STORAGE_CLEAR_ERROR =
  "Не удалось очистить сохранённую попытку. После обновления страницы она может открыться снова.";

export const ATTEMPT_INTERRUPTED_MESSAGE =
  "Страница обновилась во время отправки. Эти ответы нельзя отправить ещё раз: сервер мог уже принять их. Начните заново.";

export type AttemptStatus =
  | "in_progress"
  | "submitting"
  | "error"
  | "interrupted";

export type StoredTask = {
  id: number;
  name: string;
  topic: string;
  taskType: string;
  options: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const isAttemptStatus = (value: unknown): value is AttemptStatus =>
  value === "in_progress" ||
  value === "submitting" ||
  value === "error" ||
  value === "interrupted";

export const isStringRecord = (
  value: unknown,
): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every((item) => typeof item === "string");

export const isStoredTask = (value: unknown): value is StoredTask => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isFiniteNumber(value.id) &&
    typeof value.name === "string" &&
    typeof value.topic === "string" &&
    typeof value.taskType === "string" &&
    (value.options === null || typeof value.options === "string")
  );
};

export const isStoredTaskList = (value: unknown): value is StoredTask[] =>
  Array.isArray(value) && value.every(isStoredTask);

export function loadAttempt<T>(
  key: string,
  parse: (value: unknown) => T | null,
): T | null {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(key);
  } catch {
    return null;
  }
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    clearAttempt(key);
    return null;
  }

  const attempt = parse(parsed);
  if (!attempt) {
    clearAttempt(key);
    return null;
  }
  return attempt;
}

export function saveAttempt<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
    return sessionStorage.getItem(key) === serialized;
  } catch {
    return false;
  }
}

export function clearAttempt(key: string): boolean {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
