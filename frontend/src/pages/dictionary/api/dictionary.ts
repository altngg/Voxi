import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { request, requestDelete, requestGet, requestPut } from "../../../shared/api/axios";

export const DICTIONARY_LANGUAGE_ID = 1;
export const DICTIONARY_LANGUAGE_NAME = "Английский";

export type DictionaryEntry = {
  id: number;
  userId: number;
  word: string;
  translation: string;
  definition: string;
  languageId: number;
  createdAt: string;
};

export type DictionaryEntryPayload = {
  word: string;
  translation: string;
  definition: string;
  languageId: number;
};

export const dictionaryQueryKey = ["dictionary", "entries"] as const;

const fetchDictionaryEntries = () =>
  requestGet<DictionaryEntry[]>("/dictionary");

const createDictionaryEntry = (payload: DictionaryEntryPayload) =>
  request<DictionaryEntry>("/dictionary", payload);

const updateDictionaryEntry = ({
  id,
  payload,
}: {
  id: number;
  payload: DictionaryEntryPayload;
}) => requestPut<DictionaryEntry>(`/dictionary/${id}`, payload);

const removeDictionaryEntry = (id: number) =>
  requestDelete(`/dictionary/${id}`);

export const useDictionaryEntriesQuery = () =>
  useQuery({
    queryKey: dictionaryQueryKey,
    queryFn: fetchDictionaryEntries,
  });

const useInvalidateDictionary = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: dictionaryQueryKey });
  };
};

export const useCreateDictionaryEntryMutation = () => {
  const invalidate = useInvalidateDictionary();
  return useMutation({
    mutationFn: createDictionaryEntry,
    onSuccess: invalidate,
  });
};

export const useUpdateDictionaryEntryMutation = () => {
  const invalidate = useInvalidateDictionary();
  return useMutation({
    mutationFn: updateDictionaryEntry,
    onSuccess: invalidate,
  });
};

export const useDeleteDictionaryEntryMutation = () => {
  const invalidate = useInvalidateDictionary();
  return useMutation({
    mutationFn: removeDictionaryEntry,
    onSuccess: invalidate,
  });
};
