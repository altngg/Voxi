import { useQuery } from "@tanstack/react-query";
import { requestGet } from "../../../shared/api/axios";

export type TestTask = {
  id: number;
  name: string;
  topic: string;
  taskType: string;
  options: string | null;
};

export type TestTasksResponse = {
  testId: number;
  language: string;
  tasks: TestTask[];
  totalTimeMinutes: number;
};

type FetchTestTasksParams = {
  languageId: number;
  count: number;
};

const fetchTestTasks = ({ languageId, count }: FetchTestTasksParams) =>
  requestGet<TestTasksResponse>("/test", { languageId, count });

export const useTestTasksQuery = ({ languageId, count }: FetchTestTasksParams) =>
  useQuery({
    queryKey: ["test", "tasks", languageId, count],
    queryFn: () => fetchTestTasks({ languageId, count }),
  });
