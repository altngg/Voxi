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
  testId: number;
  language: string;
  tasks: LessonTask[];
};

type FetchLessonTasksParams = {
  languageId: number;
  maxTasks: number;
};

const fetchLessonTasks = ({ languageId, maxTasks }: FetchLessonTasksParams) =>
  requestGet<LessonTasksResponse>("/lesson/tasks", { languageId, maxTasks });

export const useLessonTasksQuery = ({
  languageId,
  maxTasks,
}: FetchLessonTasksParams) =>
  useQuery({
    queryKey: ["lesson", "tasks", languageId, maxTasks],
    queryFn: () => fetchLessonTasks({ languageId, maxTasks }),
  });
