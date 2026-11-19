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
  restored?: TestTasksResponse | null;
  enabled?: boolean;
};

export const testTasksQueryKey = (languageId: number, count: number) =>
  ["test", "tasks", languageId, count] as const;

const fetchTestTasks = ({ languageId, count }: FetchTestTasksParams) =>
  requestGet<TestTasksResponse>("/test", { languageId, count });

export const useTestTasksQuery = ({
  languageId,
  count,
  restored = null,
  enabled = true,
}: FetchTestTasksParams) =>
  useQuery({
    queryKey: testTasksQueryKey(languageId, count),
    queryFn: () => fetchTestTasks({ languageId, count }),
    enabled: enabled && restored == null,
    staleTime: Infinity,
    retry: 0,
    initialData: restored ?? undefined,
  });
