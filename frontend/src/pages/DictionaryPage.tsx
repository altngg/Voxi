import { useMemo, useState, type FormEvent } from "react";
import { BookMarked, Pencil, Search, Trash2 } from "lucide-react";

import { Button } from "../shared/ui/Button";
import { Input } from "../shared/ui/Input";
import {
  DICTIONARY_LANGUAGE_ID,
  DICTIONARY_LANGUAGE_NAME,
  useCreateDictionaryEntryMutation,
  useDeleteDictionaryEntryMutation,
  useDictionaryEntriesQuery,
  useUpdateDictionaryEntryMutation,
  type DictionaryEntry,
} from "./dictionary";

type EntryForm = {
  word: string;
  translation: string;
  definition: string;
};

const EMPTY_FORM: EntryForm = {
  word: "",
  translation: "",
  definition: "",
};

const formatWordCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} слово`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} слова`;
  }
  return `${count} слов`;
};

const formatCreatedAt = (raw: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const mutationErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

type DictionaryFormProps = {
  form: EntryForm;
  editingId: number | null;
  isSaving: boolean;
  error: string;
  onChange: (patch: Partial<EntryForm>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

const DictionaryForm = ({
  form,
  editingId,
  isSaving,
  error,
  onChange,
  onSubmit,
  onCancel,
}: DictionaryFormProps) => (
  <form className="flex flex-col gap-4" onSubmit={onSubmit}>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        title="Слово"
        inputName="word"
        inputType="text"
        value={form.word}
        onChange={(word) => onChange({ word })}
        placeholder="apple"
        autoComplete="off"
        required
        disabled={isSaving}
      />
      <Input
        title="Перевод"
        inputName="translation"
        inputType="text"
        value={form.translation}
        onChange={(translation) => onChange({ translation })}
        placeholder="яблоко"
        autoComplete="off"
        required
        disabled={isSaving}
      />
    </div>
    <label className="block">
      <span className="mb-[6px] block text-base">Определение</span>
      <textarea
        name="definition"
        value={form.definition}
        onChange={(event) => onChange({ definition: event.target.value })}
        placeholder="A round fruit that grows on a tree"
        required
        disabled={isSaving}
        rows={3}
        className="ui-input h-auto min-h-28 resize-y py-3"
      />
    </label>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="ui-pill text-base font-medium">{DICTIONARY_LANGUAGE_NAME}</span>
      <div className="flex flex-wrap gap-2">
        {editingId != null ? (
          <Button
            buttonType="button"
            buttonName="Отмена"
            variant="ghost"
            disabled={isSaving}
            onClick={onCancel}
          />
        ) : null}
        <Button
          buttonType="submit"
          buttonName={editingId != null ? "Сохранить" : "Добавить"}
          isPending={isSaving}
        />
      </div>
    </div>
    {error ? (
      <p className="text-base leading-snug text-(--danger)">{error}</p>
    ) : null}
  </form>
);

type DictionaryCardProps = {
  entry: DictionaryEntry;
  isEditing: boolean;
  isDeleting: boolean;
  confirmDelete: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

const DictionaryCard = ({
  entry,
  isEditing,
  isDeleting,
  confirmDelete,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: DictionaryCardProps) => {
  const createdAt = formatCreatedAt(entry.createdAt);

  return (
    <article
      className={`ui-card-inset flex flex-col gap-3 px-4 py-3 ${
        isEditing ? "border-(--bg-primary) bg-(--tint-primary-soft)" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl leading-tight font-bold break-words">
            {entry.word}
          </h3>
          <p className="mt-1 text-lg leading-snug break-words">
            {entry.translation}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            aria-label={`Изменить «${entry.word}»`}
            disabled={isDeleting}
            onClick={onEdit}
            className="h-auto justify-center gap-0 rounded-xl border-0 px-2 py-2 hover:bg-(--tint-primary-soft)"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            aria-label={`Удалить «${entry.word}»`}
            disabled={isDeleting}
            onClick={onAskDelete}
            className="h-auto justify-center gap-0 rounded-xl border-0 px-2 py-2 hover:bg-(--tint-primary-soft)"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
      <p className="text-base leading-snug break-words text-(--text-secondary)">
        {entry.definition}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <span className="ui-pill px-3 py-0.5 text-sm">{DICTIONARY_LANGUAGE_NAME}</span>
        {createdAt ? <span>{createdAt}</span> : null}
      </div>
      {confirmDelete ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-(--bg-error) px-3 py-2">
          <p className="text-base text-(--danger)">Удалить это слово?</p>
          <div className="flex gap-2">
            <Button
              buttonType="button"
              buttonName="Оставить"
              variant="ghost"
              disabled={isDeleting}
              onClick={onCancelDelete}
              className="h-auto px-3"
            />
            <Button
              buttonType="button"
              buttonName="Удалить"
              isPending={isDeleting}
              onClick={onConfirmDelete}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
};

export const DictionaryPage = () => {
  const { data, isPending, error, refetch, isFetching } =
    useDictionaryEntriesQuery();
  const createEntry = useCreateDictionaryEntryMutation();
  const updateEntry = useUpdateDictionaryEntryMutation();
  const deleteEntry = useDeleteDictionaryEntryMutation();

  const [form, setForm] = useState<EntryForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const entries = data ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const visibleEntries = useMemo(() => {
    if (!normalizedSearch) {
      return entries;
    }
    return entries.filter((entry) =>
      [entry.word, entry.translation, entry.definition].some((field) =>
        field.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [entries, normalizedSearch]);

  const isSaving = createEntry.isPending || updateEntry.isPending;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const payload = {
      word: form.word.trim(),
      translation: form.translation.trim(),
      definition: form.definition.trim(),
      languageId: DICTIONARY_LANGUAGE_ID,
    };

    if (!payload.word || !payload.translation || !payload.definition) {
      setFormError("Заполните слово, перевод и определение.");
      return;
    }

    if (editingId == null) {
      createEntry.mutate(payload, {
        onSuccess: resetForm,
        onError: (submitError) => {
          setFormError(
            mutationErrorMessage(submitError, "Не удалось добавить слово"),
          );
        },
      });
      return;
    }

    updateEntry.mutate(
      { id: editingId, payload },
      {
        onSuccess: resetForm,
        onError: (submitError) => {
          setFormError(
            mutationErrorMessage(submitError, "Не удалось сохранить слово"),
          );
        },
      },
    );
  };

  const startEdit = (entry: DictionaryEntry) => {
    setEditingId(entry.id);
    setPendingDeleteId(null);
    setFormError("");
    setForm({
      word: entry.word,
      translation: entry.translation,
      definition: entry.definition,
    });
  };

  if (isPending) {
    return (
      <main className="flex min-h-full items-center justify-center px-4">
        <p className="text-lg text-(--text-primary)">Загружаем словарь...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="ui-form-page">
        <section className="ui-card flex max-w-md flex-col items-center gap-4 p-6 text-center">
          <h1 className="ui-page-title">Не удалось загрузить словарь</h1>
          <p className="text-base text-(--text-secondary)">
            {error instanceof Error
              ? error.message
              : "Попробуйте обновить страницу позже."}
          </p>
          <Button
            buttonType="button"
            buttonName="Повторить"
            isPending={isFetching}
            onClick={() => refetch()}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="ui-page">
      <section className="ui-card ui-page-section max-w-4xl px-4 py-6 sm:px-6">
        <header className="flex items-center gap-4">
          <span className="ui-icon-tile" aria-hidden>
            <BookMarked className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="ui-page-title">Словарь</h1>
            <p className="mt-1 text-base text-(--text-secondary)">
              {formatWordCount(entries.length)}
            </p>
          </div>
        </header>

        <hr className="ui-divider" />

        <DictionaryForm
          form={form}
          editingId={editingId}
          isSaving={isSaving}
          error={formError}
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />

        <div className="mt-8">
          <label className="block">
            <span className="mb-[6px] block text-base">Поиск</span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-(--text-secondary)"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Слово, перевод или определение"
                aria-label="Поиск по словарю"
                className="ui-input pl-12"
              />
            </span>
          </label>
        </div>

        <section aria-label="Список слов" className="mt-6 flex flex-col gap-3">
          {entries.length === 0 ? (
            <p className="text-base text-(--text-secondary)">
              В словаре пока пусто. Добавьте первое слово.
            </p>
          ) : visibleEntries.length === 0 ? (
            <p className="text-base text-(--text-secondary)">
              По запросу «{search.trim()}» ничего не найдено.
            </p>
          ) : (
            visibleEntries.map((entry) => (
              <DictionaryCard
                key={entry.id}
                entry={entry}
                isEditing={entry.id === editingId}
                isDeleting={
                  deleteEntry.isPending && pendingDeleteId === entry.id
                }
                confirmDelete={pendingDeleteId === entry.id}
                onEdit={() => startEdit(entry)}
                onAskDelete={() => setPendingDeleteId(entry.id)}
                onCancelDelete={() => setPendingDeleteId(null)}
                onConfirmDelete={() => {
                  deleteEntry.mutate(entry.id, {
                    onSuccess: () => {
                      setPendingDeleteId(null);
                      if (editingId === entry.id) {
                        resetForm();
                      }
                    },
                  });
                }}
              />
            ))
          )}
        </section>
        {deleteEntry.error ? (
          <p className="mt-3 text-base leading-snug text-(--danger)">
            {mutationErrorMessage(
              deleteEntry.error,
              "Не удалось удалить слово",
            )}
          </p>
        ) : null}
      </section>
    </main>
  );
};
