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
  incorrectTasks: number[];
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
  incorrect_tasks: number[];
  new_tasks: TestTask[];
};

// TODO: убрать, когда заработает реальный /api/lesson-results
const USE_MOCK_LESSON_RESULTS = true;

const MOCK_NEW_TASKS_POOL: TestTask[] = [
  {
    id: 9001,
    name: "She ___ to school every day.",
    topic: "Present Simple",
    taskType: "1",
    options: "go, goes, going, gone",
  },
  {
    id: 9002,
    name: "I ___ a book yesterday.",
    topic: "Past Simple",
    taskType: "2",
    options: null,
  },
  {
    id: 9003,
    name: "Cats can fly.",
    topic: "True / False",
    taskType: "3",
    options: null,
  },
  {
    id: 9004,
    name: "We ___ tennis on Sundays.",
    topic: "Present Simple",
    taskType: "1",
    options: "play, plays, playing, played",
  },
  {
    id: 9005,
    name: "He ___ his keys this morning.",
    topic: "Past Simple",
    taskType: "2",
    options: null,
  },
  {
    id: 9006,
    name: "The sun rises in the west.",
    topic: "True / False",
    taskType: "3",
    options: null,
  },
];

const shuffled = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const mockSubmit = async (
  payload: SubmitLessonResultsPayload,
): Promise<LessonResultsResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const total = payload.taskResults.length;

  // ~30% — все верно (поздравление), ~70% — что-то на повтор
  const isAllCorrect = Math.random() < 0.3;
  if (isAllCorrect) {
    return { correctTasks: total, incorrectTasks: [], newTasks: [] };
  }

  const correctTasks = Math.floor(Math.random() * total);
  const incorrectCount = total - correctTasks;
  const incorrectTasks = shuffled(payload.taskResults)
    .slice(0, incorrectCount)
    .map((t) => t.taskId);

  const newTasks = shuffled(MOCK_NEW_TASKS_POOL).slice(
    0,
    Math.min(Math.max(1, incorrectCount), 3),
  );

  return { correctTasks, incorrectTasks, newTasks };
};

export const lessonResultsApi = {
  async submit(
    payload: SubmitLessonResultsPayload,
  ): Promise<LessonResultsResponse> {
    if (USE_MOCK_LESSON_RESULTS) {
      return mockSubmit(payload);
    }

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
      incorrectTasks: data.incorrect_tasks ?? [],
      newTasks: data.new_tasks ?? [],
    };
  },
};
