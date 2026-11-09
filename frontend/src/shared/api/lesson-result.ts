import type { TestTask } from "../../pages/test/api/test-queries";
import { request } from "./axios";

// change model fields names later when backend is ready

export type LessonResultTaskPayload = {
  taskId: number;
  userAnswer: string;
};

export type SubmitLessonResultsPayload = {
  languageId: number;
  taskResults: LessonResultTaskPayload[];
};

export type IncorrectTaskWithExplanation = {
  id: number;
  explanation: string;
};

export type LessonResultsResponse = {
  correctTasks: number;
  incorrectTasksWithExplanations: IncorrectTaskWithExplanation[];
  newTasks: TestTask[];
};

type RawIncorrectTask = {
  id?: unknown;
  explanation?: unknown;
};

type RawNewTask = {
  id: number;
  name: string;
  options: string | null;
  topic: string;
  taskType: string;
};

type LessonResultsApiResponse = {
  correctTasks?: number;
  correct_tasks?: number;
  incorrectTasksWithExplanations?: RawIncorrectTask[];
  incorrect_tasks_with_explanations?: RawIncorrectTask[];
  incorrectTaskIds?: number[];
  newTasks?: RawNewTask[];
  new_tasks?: RawNewTask[];
};

const toIncorrectTasks = (
  data: LessonResultsApiResponse,
): IncorrectTaskWithExplanation[] => {
  const raw =
    data.incorrectTasksWithExplanations ??
    data.incorrect_tasks_with_explanations;

  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (typeof item?.id !== "number" || !Number.isFinite(item.id)) {
        return [];
      }
      return [
        {
          id: item.id,
          explanation:
            typeof item.explanation === "string" ? item.explanation.trim() : "",
        },
      ];
    });
  }

  return (data.incorrectTaskIds ?? []).map((id) => ({
    id,
    explanation: "",
  }));
};

const toNewTasks = (tasks: RawNewTask[] | undefined): TestTask[] =>
  (tasks ?? []).map((task) => ({
    id: task.id,
    name: task.name,
    topic: task.topic,
    taskType: task.taskType,
    options: task.options,
  }));

export const lessonResultsApi = {
  async submit(
    payload: SubmitLessonResultsPayload,
  ): Promise<LessonResultsResponse> {
    const data = await request<LessonResultsApiResponse>(
      "/lesson/results",
      payload,
    );
    return {
      correctTasks: data.correctTasks ?? data.correct_tasks ?? 0,
      incorrectTasksWithExplanations: toIncorrectTasks(data),
      newTasks: toNewTasks(data.newTasks ?? data.new_tasks),
    };
  },
};
