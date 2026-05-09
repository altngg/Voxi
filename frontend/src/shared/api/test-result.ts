import { request } from "./axios";

export type TestResultTaskPayload = {
  taskId: number;
  userAnswer: string;
};

export type SubmitTestResultPayload = {
  testId: number;
  taskResults: TestResultTaskPayload[];
};

export type TestResultResponseDto = {
  testResultId: number;
  overallLevel: string;
  grammarScore: number;
  vocabularyScore: number;
  topicScores: Record<string, number>;
};

/** Поля для экрана результатов (совпадают с ответом POST /test-result). */
export type TestResultScores = Pick<
  TestResultResponseDto,
  "overallLevel" | "grammarScore" | "vocabularyScore"
>;

export const testResultApi = {
  submit(payload: SubmitTestResultPayload) {
    return request<TestResultResponseDto>("/test-result", payload);
  },
};
