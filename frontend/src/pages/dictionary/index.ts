export {
  DICTIONARY_LANGUAGE_ID,
  DICTIONARY_LANGUAGE_NAME,
  DICTIONARY_LANGUAGES,
  dictionaryLanguageName,
  useCreateDictionaryEntryMutation,
  useDeleteDictionaryEntryMutation,
  useDictionaryEntriesQuery,
  useUpdateDictionaryEntryMutation,
} from "./api/dictionary";
export type { DictionaryEntry, DictionaryEntryPayload } from "./api/dictionary";
