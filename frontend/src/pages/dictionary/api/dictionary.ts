import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { request, requestDelete, requestGet, requestPut } from "../../../shared/api/axios";

export const DICTIONARY_LANGUAGES = [
  { id: 1, name: "Английский" },
] as const;

export const DICTIONARY_LANGUAGE_ID = DICTIONARY_LANGUAGES[0].id;
export const DICTIONARY_LANGUAGE_NAME = DICTIONARY_LANGUAGES[0].name;

export const dictionaryLanguageName = (languageId: number) =>
  DICTIONARY_LANGUAGES.find((language) => language.id === languageId)?.name ??
  `Язык #${languageId}`;

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
