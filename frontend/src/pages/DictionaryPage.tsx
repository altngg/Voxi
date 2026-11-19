import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  BookMarked,
  Calendar,
  Languages,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { cn } from "../shared/lib/cn";
import { Button } from "../shared/ui/Button";
import { Combobox } from "../shared/ui/Combobox";
import { Input } from "../shared/ui/Input";
import {
  DICTIONARY_LANGUAGE_ID,
  DICTIONARY_LANGUAGE_NAME,
  DICTIONARY_LANGUAGES,
  dictionaryLanguageName,
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

const ALL_LANGUAGES = "Все языки";

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

const mutationErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

type SortToggleProps = {
  byTime: boolean;
  onToggle: () => void;
};

const SortToggle = ({ byTime, onToggle }: SortToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={byTime}
    title={byTime ? "По времени" : "По алфавиту"}
    aria-label={
      byTime
        ? "Сортировка по времени. Переключить на алфавит"
        : "Сортировка по алфавиту. Переключить на время"
    }
    className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-xl border-0 bg-transparent text-(--text-primary) transition-colors hover:bg-(--tint-primary-soft)"
  >
    <span className="relative h-5 w-5">
      <Calendar
        aria-hidden
        className={cn(
          "absolute inset-0 h-5 w-5 transition-all duration-500 ease-in-out",
          byTime
            ? "scale-100 rotate-0 opacity-100"
            : "scale-50 -rotate-90 opacity-0",
        )}
      />
      <Languages
        aria-hidden
        className={cn(
          "absolute inset-0 h-5 w-5 transition-all duration-500 ease-in-out",
          byTime
            ? "scale-50 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100",
        )}
      />
    </span>
  </button>
);

type DictionaryFormProps = {
  form: EntryForm;
  editingId: number | null;
  isSaving: boolean;
  error: string;
  onChange: (patch: Partial<EntryForm>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

const DictionaryFormDialog = ({
  form,
  editingId,
  isSaving,
  error,
  onChange,
  onSubmit,
  onCancel,
}: DictionaryFormProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    dialog.showModal();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dictionary-form-title"
      onCancel={(event) => {
        if (isSaving) {
          event.preventDefault();
          return;
        }
        onCancel();
      }}
      onClick={(event) => {
        if (isSaving || event.target !== event.currentTarget) {
          return;
        }
        onCancel();
      }}
      className="m-auto w-[min(40rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.5rem] border-4 border-(--default-border) bg-(--bg-canvas) p-6 text-(--text-primary) shadow-(--shadow-overlay) backdrop:bg-black/25"
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <h2 id="dictionary-form-title" className="ui-form-title text-left">
          {editingId != null ? "Изменить слово" : "Новое слово"}
        </h2>
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
          <span className="ui-pill text-base font-medium">
            {DICTIONARY_LANGUAGE_NAME}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              buttonType="button"
              buttonName="Отмена"
              variant="ghost"
              disabled={isSaving}
              onClick={onCancel}
            />
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
    </dialog>
  );
};

type MeaningFlipProps = {
  translation: string;
  definition: string;
  faceClassName: string;
};

const MeaningFlip = ({
  translation,
  definition,
  faceClassName,
}: MeaningFlipProps) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={revealed}
      aria-label={
        revealed
          ? `Скрыть перевод и значение. ${translation}. ${definition}`
          : "Показать перевод и значение"
      }
      onClick={() => setRevealed((current) => !current)}
      className="group h-full min-h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left [perspective:900px]"
    >
      <span
        className={cn(
          "grid h-full min-h-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d] motion-reduce:transition-none",
          revealed && "[transform:rotateY(180deg)]",
        )}
      >
        <span
          aria-hidden={revealed}
          className={cn(
            "col-start-1 row-start-1 flex items-center justify-center px-4 py-4 text-center text-base font-medium text-(--text-secondary) transition-colors [backface-visibility:hidden] group-hover:bg-(--tint-primary-soft)",
            faceClassName,
          )}
        >
          Перевод и значение
        </span>
        <span
          aria-hidden={!revealed}
          className={cn(
            "col-start-1 row-start-1 flex flex-col justify-center gap-1 px-4 py-4 transition-colors [transform:rotateY(180deg)] [backface-visibility:hidden] group-hover:bg-(--tint-primary-soft)",
            faceClassName,
          )}
        >
          <span className="text-lg leading-snug break-words">
            {translation}
          </span>
          <span className="text-base leading-snug break-words text-(--text-secondary)">
            {definition}
          </span>
        </span>
      </span>
    </button>
  );
};

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
  const faceClassName = isEditing
    ? "bg-(--tint-primary-soft)"
    : "bg-(--bg-canvas)";

  return (
    <article
      className={`ui-card-inset overflow-hidden ${
        isEditing ? "border-(--bg-primary) bg-(--tint-primary-soft)" : ""
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,17fr)_minmax(0,33fr)]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-(--default-border) px-4 py-4 sm:border-r-2 sm:border-b-0">
          <h3 className="min-w-0 text-xl leading-tight font-bold wrap-break-word">
            {entry.word}
          </h3>
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
        <MeaningFlip
          translation={entry.translation}
          definition={entry.definition}
          faceClassName={faceClassName}
        />
      </div>
      {confirmDelete ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-(--default-border) bg-(--bg-error) px-4 py-3">
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
  const [isFormOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [sortByTime, setSortByTime] = useState(true);
  const [languageLabel, setLanguageLabel] = useState(ALL_LANGUAGES);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const entries = data ?? [];
  const languageOptions = useMemo(() => {
    const names: string[] = DICTIONARY_LANGUAGES.map(
      (language) => language.name,
    );

    const extraNames = entries
      .map((entry) => dictionaryLanguageName(entry.languageId))
      .filter((name) => !names.includes(name));

    return [ALL_LANGUAGES, ...names, ...extraNames];
  }, [entries]);
  const visibleEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const selectedLanguage = DICTIONARY_LANGUAGES.find(
      (language) => language.name === languageLabel,
    );

    const filtered = entries.filter((entry) => {
      const matchesLanguage =
        languageLabel === ALL_LANGUAGES ||
        entry.languageId === selectedLanguage?.id ||
        dictionaryLanguageName(entry.languageId) === languageLabel;
      if (!matchesLanguage) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return [entry.word, entry.translation, entry.definition].some((field) =>
        field.toLowerCase().includes(normalizedSearch),
      );
    });

    return filtered.sort((left, right) => {
      if (!sortByTime) {
        return left.word.localeCompare(right.word, "ru", {
          sensitivity: "base",
        });
      }
      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
  }, [entries, languageLabel, search, sortByTime]);

  const isSaving = createEntry.isPending || updateEntry.isPending;

  const closeForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setFormOpen(false);
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
        onSuccess: closeForm,
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
        onSuccess: closeForm,
        onError: (submitError) => {
          setFormError(
            mutationErrorMessage(submitError, "Не удалось сохранить слово"),
          );
        },
      },
    );
  };

  const openCreate = () => {
    setEditingId(null);
    setPendingDeleteId(null);
    setFormError("");
    setForm(EMPTY_FORM);
    setFormOpen(true);
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
    setFormOpen(true);
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
      <section className="ui-card ui-page-section flex min-h-[calc(100dvh-2rem)] max-w-6xl flex-col px-4 pt-2 pb-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="ui-icon-tile" aria-hidden>
              <BookMarked className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="ui-page-title">Словарь</h1>
              <p className="mt-1 text-base text-(--text-secondary)">
                {formatWordCount(entries.length)}
              </p>
            </div>
          </div>
          <Button
            buttonType="button"
            buttonName="Добавить слово"
            onClick={openCreate}
            className="h-auto justify-center gap-3 px-4"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <hr className="ui-divider" />

        {isFormOpen ? (
          <DictionaryFormDialog
            form={form}
            editingId={editingId}
            isSaving={isSaving}
            error={formError}
            onChange={(patch) =>
              setForm((current) => ({ ...current, ...patch }))
            }
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        ) : null}

        <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)_auto]">
          <label className="block min-w-0">
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
                placeholder="Слово или перевод"
                aria-label="Поиск по словарю"
                className="ui-input pl-12"
              />
            </span>
          </label>
          <Combobox
            title="Язык"
            name="dictionary-language"
            value={languageLabel}
            onChange={setLanguageLabel}
            options={languageOptions}
          />
          <SortToggle
            byTime={sortByTime}
            onToggle={() => setSortByTime((current) => !current)}
          />
        </div>

        <section
          aria-label="Список слов"
          className="mt-6 flex flex-1 flex-col gap-3"
        >
          {entries.length === 0 ? (
            <p className="text-base text-(--text-secondary)">
              В словаре пока пусто. Добавьте первое слово.
            </p>
          ) : visibleEntries.length === 0 ? (
            <p className="text-base text-(--text-secondary)">
              Ничего не найдено.
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
                        closeForm();
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
