import type { TestTask } from "../../pages/test/api/test-queries";
import { request } from "./axios";

export type LessonResultTaskPayload = {
  taskId: number;
  userAnswer: string;
};

export type SubmitLessonResultsPayload = {
  taskResults: LessonResultTaskPayload[];
};

export type LessonResultsResponse = {
  correctTasks: number;
  newTasks: TestTask[];
};

type LessonResultsApiRequest = {
  task_results: {
    task_id: number;
    user_answer: string;
  }[];
};

type LessonResultsApiResponse = {
  correct_tasks: number;
  new_tasks: TestTask[];
};

export const lessonResultsApi = {
  async submit(
    payload: SubmitLessonResultsPayload,
  ): Promise<LessonResultsResponse> {
    const body: LessonResultsApiRequest = {
      task_results: payload.taskResults.map(({ taskId, userAnswer }) => ({
        task_id: taskId,
        user_answer: userAnswer,
      })),
    };
    const data = await request<LessonResultsApiResponse>(
      "/lesson-results",
      body,
    );
    return {
      correctTasks: data.correct_tasks,
      newTasks: data.new_tasks ?? [],
    };
  },
};
