import { TaskByType } from "../pages/test/TaskByType";
import type { TestTask } from "../pages/test/api/test-queries";

type LessonTaskRowProps = {
  task: TestTask;
  theory?: string;
  onAnswerValueChange?: (taskId: string, value: string) => void;
};

export const LessonTaskRow = ({
  task,
  theory,
  onAnswerValueChange,
}: LessonTaskRowProps) => {
  return (
    <li className="rounded-[20px] border-2 border-(--default-border) p-4">
      {theory ? (
        <div className="mb-4 rounded-2xl border px-4 py-3">{theory}</div>
      ) : null}
      <TaskByType task={task} onAnswerValueChange={onAnswerValueChange} />
    </li>
  );
};
