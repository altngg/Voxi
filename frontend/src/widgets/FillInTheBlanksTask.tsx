import { useInitialAnswers } from "../shared/lib/use-initial-answers";
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
  initialAnswers?: Record<string, string>;
  disabled?: boolean;
  onAnswersChange?: (answers: Record<string, string>) => void;
};

export const FillInTheBlanksTask = ({
  title,
  items,
  initialAnswers,
  disabled = false,
  onAnswersChange,
}: FillInTheBlanksTaskProps) => {
  const [answers, commitAnswers] = useInitialAnswers(
    initialAnswers,
    onAnswersChange,
  );

  const handleAnswerChange = (id: string, value: string) => {
    if (disabled) {
      return;
    }
    commitAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  return (
    <section>
      <h2 className="ui-section-title mb-2">{title}</h2>

      <ol className="space-y-2 text-lg font-medium text-(--text-primary)">
        {items.map((item, index) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3">
            <span>{item.before}</span>
            <Input
              title=""
              inputType="text"
              inputName={item.id}
              value={answers[item.id] ?? ""}
              disabled={disabled}
              onChange={(value) => handleAnswerChange(item.id, value)}
              placeholder={item.placeholder}
              ariaLabel={`Ответ для предложения ${index + 1}`}
              labelClassName="inline-block"
              inputClassName="w-40"
            />
            <span>{item.after}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};
