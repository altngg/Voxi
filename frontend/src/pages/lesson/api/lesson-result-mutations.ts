import { useMutation } from "@tanstack/react-query";
import {
  lessonResultsApi,
  type SubmitLessonResultsPayload,
} from "../../../shared/api/lesson-result";

export const useSubmitLessonResultsMutation = () =>
  useMutation({
    mutationFn: (payload: SubmitLessonResultsPayload) =>
      lessonResultsApi.submit(payload),
  });
