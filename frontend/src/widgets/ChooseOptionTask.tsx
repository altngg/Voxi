import { useEffect, useRef, useState } from "react";
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
  onAnswersChange,
}: ChooseOptionTaskProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const onAnswersChangeRef = useRef(onAnswersChange);
  onAnswersChangeRef.current = onAnswersChange;

  useEffect(() => {
    onAnswersChangeRef.current?.(answers);
  }, [answers]);

  const handleOptionToggle = (
    itemId: string,
    optionId: string,
    isChecked: boolean,
  ) => {
    setAnswers((prev) => {
      const nextAnswerForItem = isChecked ? optionId : "";

      return {
        ...prev,
        [itemId]: nextAnswerForItem,
      };
    });
  };

  return (
    <section>
      <h2 className="mb-2 text-lg font-medium text-(--text-primary)">
        {title}
      </h2>

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
