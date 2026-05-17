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
  count: number;
};

const fetchLessonTasks = ({ languageId, count }: FetchLessonTasksParams) =>
  requestGet<LessonTasksResponse>("/lesson", { languageId, count });

export const useLessonTasksQuery = ({
  languageId,
  count,
}: FetchLessonTasksParams) =>
  useQuery({
    queryKey: ["lesson", "tasks", languageId, count],
    queryFn: () => fetchLessonTasks({ languageId, count }),
  });
