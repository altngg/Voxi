import { useState } from "react";
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

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = {
        ...prev,
        [id]: value,
      };
      onAnswersChange?.(next);
      return next;
    });
  };

  return (
    <section className="mt-8">
      <h2 className="mb-[10px] text-[40px] leading-[1.1] font-bold">{title}</h2>

      <ol className="space-y-4 text-[40px] leading-relaxed text-(--text-primary)">
        {items.map((item, index) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3">
            <span className="mr-1">{index + 1}.</span>
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
