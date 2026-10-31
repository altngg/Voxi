import { useEffect, useRef, type RefObject } from "react";
import { Check } from "lucide-react";

import { cn } from "../shared/lib/cn";
import { Button } from "../shared/ui/Button";

type Language = {
  id: number;
  name: string;
  code: string;
};

const AVAILABLE_LANGUAGES: Language[] = [
  { id: 1, name: "Английский", code: "EN" },
];

type LanguageDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  selectedLanguageId?: number;
  onSelect?: (languageId: number) => void;
  className?: string;
};

export const LanguageDialog = ({
  isOpen,
  onClose,
  containerRef,
  selectedLanguageId = 1,
  onSelect,
  className,
}: LanguageDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (isOpen && !dialog.open) {
      dialog.show();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, containerRef]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Выбор языка"
      className={cn(
        "top-auto right-auto bottom-auto left-auto m-0 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-(--default-border) bg-(--bg-canvas) p-3 text-(--text-primary) shadow-(--shadow-overlay)",
        className,
      )}
    >
      <header className="mb-2 px-1">
        <h2 className="text-base font-semibold">Язык</h2>
      </header>

      <ul className="flex flex-col gap-1">
        {AVAILABLE_LANGUAGES.map((language) => {
          const isSelected = language.id === selectedLanguageId;
          return (
            <li key={language.id}>
              <Button
                variant="ghost"
                aria-pressed={isSelected}
                onClick={() => {
                  onSelect?.(language.id);
                  onClose();
                }}
                className={cn(
                  "h-auto w-full justify-between gap-3 rounded-xl border-0 px-3 py-2 text-left",
                  "hover:bg-(--tint-primary-soft) hover:text-(--text-primary)",
                  isSelected && "bg-(--tint-primary-medium)",
                )}
              >
                <span className="flex items-center gap-3 text-base">
                  <span className="rounded-md bg-(--bg-secondary) px-2 py-0.5 text-xs font-bold tracking-wider">
                    {language.code}
                  </span>
                  {language.name}
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                )}
              </Button>
            </li>
          );
        })}
      </ul>

      <p className="mt-2 px-1 text-xs text-(--text-secondary)">
        Скоро будут доступны и другие языки
      </p>
    </dialog>
  );
};
