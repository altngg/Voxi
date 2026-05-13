import { useMutation } from "@tanstack/react-query";
import {
  testResultApi,
  type SubmitTestResultPayload,
} from "../../../shared/api/test-result";

export const useSubmitTestResultMutation = () =>
  useMutation({
    mutationFn: (payload: SubmitTestResultPayload) =>
      testResultApi.submit(payload),
  });
