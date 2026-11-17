import { useInitialAnswers } from "../shared/lib/use-initial-answers";
import { Button } from "../shared/ui/Button";

export type TrueFalseTaskItem = {
  id: string;
  statement: string;
};

type TrueFalseTaskProps = {
  title: string;
  items: TrueFalseTaskItem[];
  initialAnswers?: Record<string, boolean>;
  disabled?: boolean;
  onAnswersChange?: (answers: Record<string, boolean>) => void;
};

const ANSWER_BUTTON_CLASS =
  "min-w-[128px] justify-center gap-0 px-5 text-base font-medium";

export const TrueFalseTask = ({
  title,
  items,
  initialAnswers,
  disabled = false,
  onAnswersChange,
}: TrueFalseTaskProps) => {
  const [answers, commitAnswers] = useInitialAnswers(
    initialAnswers,
    onAnswersChange,
  );

  const handleAnswerChange = (itemId: string, value: boolean) => {
    if (disabled) {
      return;
    }
    commitAnswers((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  return (
    <section>
      <h2 className="ui-section-title mb-2">{title}</h2>

      <ol className="space-y-3 text-lg font-medium text-(--text-primary)">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
          >
            <p className="md:pr-4">{item.statement}</p>

            <div className="flex shrink-0 items-center gap-2 pl-7 md:pl-0">
              <Button
                buttonName="True"
                variant={answers[item.id] === true ? "primary" : "ghost"}
                disabled={disabled}
                onClick={() => handleAnswerChange(item.id, true)}
                className={ANSWER_BUTTON_CLASS}
              />
              <Button
                buttonName="False"
                variant={answers[item.id] === false ? "primary" : "ghost"}
                disabled={disabled}
                onClick={() => handleAnswerChange(item.id, false)}
                className={ANSWER_BUTTON_CLASS}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
