import { useEffect, useRef, useState } from "react";
import { Button } from "../shared/ui/Button";

export type TrueFalseTaskItem = {
  id: string;
  statement: string;
};

type TrueFalseTaskProps = {
  title: string;
  items: TrueFalseTaskItem[];
  onAnswersChange?: (answers: Record<string, boolean>) => void;
};

const getAnswerButtonClassName = (isActive: boolean) =>
  isActive
    ? "min-w-[128px] justify-center gap-0 px-5 text-lg font-medium hover:bg-(--bg-primary) hover:text-(--bg-canvas)"
    : "min-w-[128px] justify-center gap-0 bg-transparent px-5 text-lg font-medium text-(--text-primary) hover:bg-(--bg-primary) hover:text-(--bg-canvas)";

export const TrueFalseTask = ({
  title,
  items,
  onAnswersChange,
}: TrueFalseTaskProps) => {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const onAnswersChangeRef = useRef(onAnswersChange);
  onAnswersChangeRef.current = onAnswersChange;

  useEffect(() => {
    onAnswersChangeRef.current?.(answers);
  }, [answers]);

  const handleAnswerChange = (itemId: string, value: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  return (
    <section className="mt-4">
      <h2 className="mb-2 text-lg font-medium text-(--text-primary)">
        {title}
      </h2>

      <ol className="space-y-3 text-lg font-medium text-(--text-primary)">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
          >
            <p className="md:pr-4">
              <span>{index + 1}. </span>
              {item.statement}
            </p>

            <div className="flex shrink-0 items-center gap-2 pl-7 md:pl-0">
              <Button
                buttonName="True"
                onClick={() => handleAnswerChange(item.id, true)}
                className={getAnswerButtonClassName(answers[item.id] === true)}
              />
              <Button
                buttonName="False"
                onClick={() => handleAnswerChange(item.id, false)}
                className={getAnswerButtonClassName(answers[item.id] === false)}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
