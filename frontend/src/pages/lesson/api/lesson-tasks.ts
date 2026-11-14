import { useQuery } from "@tanstack/react-query";
import { requestGet } from "../../../shared/api/axios";

export type LessonTask = {
  id: number;
  name: string;
  topic: string;
  taskType: string;
  options: string | null;
};

export type LessonTasksResponse = {
  testId?: number;
  language: string;
  tasks: LessonTask[];
};

type FetchLessonTasksParams = {
  languageId: number;
  maxTasks: number;
  restored?: LessonTasksResponse | null;
};

export const lessonTasksQueryKey = (languageId: number, maxTasks: number) =>
  ["lesson", "tasks", languageId, maxTasks] as const;

const fetchLessonTasks = ({ languageId, maxTasks }: FetchLessonTasksParams) =>
  requestGet<LessonTasksResponse>("/lesson/tasks", { languageId, maxTasks });

export const useLessonTasksQuery = ({
  languageId,
  maxTasks,
  restored = null,
}: FetchLessonTasksParams) =>
  useQuery({
    queryKey: lessonTasksQueryKey(languageId, maxTasks),
    queryFn: () => fetchLessonTasks({ languageId, maxTasks }),
    enabled: restored == null,
    staleTime: Infinity,
    retry: 0,
    initialData: restored ?? undefined,
  });
