import type { TestTask } from "../../pages/test/api/test-queries";
import { request } from "./axios";

export type LessonResultTaskPayload = {
  taskId: number;
  userAnswer: string;
};

export type SubmitLessonResultsPayload = {
  languageId: number;
  taskResults: LessonResultTaskPayload[];
};

export type LessonResultsResponse = {
  correctTasks: number;
  incorrectTasks: number[];
  newTasks: TestTask[];
};

type LessonResultsApiResponse = {
  correctTasks: number;
  incorrectTaskIds: number[];
  totalTasks: number;
  progressPercent: number;
  updatedTopicScores: Record<string, number>;
  newTasks: {
    name: string;
    options: string | null;
    topic: string;
    taskType: string;
  }[];
};

export const lessonResultsApi = {
  async submit(
    payload: SubmitLessonResultsPayload,
  ): Promise<LessonResultsResponse> {
    const data = await request<LessonResultsApiResponse>(
      "/lesson/results",
      payload,
    );
    return {
      correctTasks: data.correctTasks,
      incorrectTasks: data.incorrectTaskIds ?? [],
      newTasks: (data.newTasks ?? []).map((task, index) => ({
        id: -(index + 1),
        name: task.name,
        topic: task.topic,
        taskType: task.taskType,
        options: task.options,
      })),
    };
  },
};
