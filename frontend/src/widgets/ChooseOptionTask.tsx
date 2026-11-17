import { useInitialAnswers } from "../shared/lib/use-initial-answers";
import { Checkbox } from "../shared/ui/Checkbox";

type ChooseOption = {
  id: string;
  label: string;
};

export type ChooseOptionItem = {
  id: string;
  before: string;
  after: string;
  options: ChooseOption[];
};

type ChooseOptionTaskProps = {
  title: string;
  items: ChooseOptionItem[];
  initialAnswers?: Record<string, string>;
  disabled?: boolean;
  onAnswersChange?: (answers: Record<string, string>) => void;
};

const getLongestOptionLength = (options: ChooseOption[]) =>
  options.reduce(
    (maxLength, option) => Math.max(maxLength, option.label.length),
    1,
  );

export const ChooseOptionTask = ({
  title,
  items,
  initialAnswers,
  disabled = false,
  onAnswersChange,
}: ChooseOptionTaskProps) => {
  const [answers, commitAnswers] = useInitialAnswers(
    initialAnswers,
    onAnswersChange,
  );

  const handleOptionToggle = (
    itemId: string,
    optionId: string,
    isChecked: boolean,
  ) => {
    if (disabled) {
      return;
    }
    commitAnswers((prev) => ({
      ...prev,
      [itemId]: isChecked ? optionId : "",
    }));
  };

  return (
    <section>
      <h2 className="ui-section-title mb-2">{title}</h2>

      <ol className="space-y-3 text-lg font-medium text-(--text-primary)">
        {items.map((item, index) => (
          <li key={item.id}>
            <p className="mb-2 flex flex-wrap items-center gap-3">
              <span>{item.before}</span>
              <span
                aria-label={`Выбранный ответ для вопроса ${index + 1}`}
                className="inline-flex h-[45px] items-center rounded-[50px] border-[3px] border-(--default-border) px-4"
                style={{
                  width: `calc(${getLongestOptionLength(item.options)}ch + 2rem)`,
                }}
              >
                {item.options.find((option) => option.id === answers[item.id])
                  ?.label ?? "\u00A0"}
              </span>
              <span>{item.after}</span>
            </p>

            <div className="space-y-1 pl-8">
              {item.options.map((option) => (
                <Checkbox
                  key={option.id}
                  name={`${item.id}-${option.id}`}
                  label={option.label}
                  checked={answers[item.id] === option.id}
                  disabled={disabled}
                  onChange={(checked) =>
                    handleOptionToggle(item.id, option.id, checked)
                  }
                />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
