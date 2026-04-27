import { ProgressBar } from "../widgets/ProgressBar";
import { FillInTheBlanksTask } from "../widgets/FillInTheBlanksTask";

export const TestPage = () => {
  return (
    <main className="h-dvh py-4 sm:px-6">
      <section className="mx-auto h-[calc(100dvh-2rem)] w-full max-w-6xl rounded-3xl border-4 border-(--default-border) px-4 py-2">
        <ProgressBar totalQuestions={25} completedQuestions={5} />
        <FillInTheBlanksTask
          title="Заполните предложения"
          items={[
            {
              id: "first",
              before: "I usually have",
              after: "at 2 p.m.",
              placeholder: "l",
            },
            {
              id: "second",
              before: "My father can't read",
              after: "his glasses.",
              placeholder: "w",
            },
            {
              id: "third",
              before: "I'm Gleb. Nice to",
              after: "you, Clair.",
              placeholder: "m",
            },
          ]}
        />
      </section>
    </main>
  );
};
