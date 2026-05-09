import { useEffect, useRef, useState } from "react";
import { Input } from "../shared/ui/Input";

export type FillInTheBlanksItem = {
  id: string;
  before: string;
  after: string;
  placeholder?: string;
};

type FillInTheBlanksTaskProps = {
  title: string;
  items: FillInTheBlanksItem[];
  onAnswersChange?: (answers: Record<string, string>) => void;
};

export const FillInTheBlanksTask = ({
  title,
  items,
  onAnswersChange,
}: FillInTheBlanksTaskProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const onAnswersChangeRef = useRef(onAnswersChange);
  onAnswersChangeRef.current = onAnswersChange;

  useEffect(() => {
    onAnswersChangeRef.current?.(answers);
  }, [answers]);

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  return (
    <section>
      <h2 className="mb-2 text-lg font-medium text-(--text-primary)">
        {title}
      </h2>

      <ol className="space-y-2 text-lg font-medium text-(--text-primary)">
        {items.map((item, index) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3">
            <span>{item.before}</span>
            <Input
              title=""
              inputType="text"
              inputName={item.id}
              value={answers[item.id] ?? ""}
              onChange={(value) => handleAnswerChange(item.id, value)}
              placeholder={item.placeholder}
              ariaLabel={`Ответ для предложения ${index + 1}`}
              labelClassName="inline-block"
              inputClassName="mb-0 w-40 border-(--default-border)"
            />
            <span>{item.after}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};
