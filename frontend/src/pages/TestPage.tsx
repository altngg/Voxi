import { ProgressBar } from "../widgets/ProgressBar";
import { FillInTheBlanksTask } from "../widgets/FillInTheBlanksTask";
import { ChooseOptionTask } from "../widgets/ChooseOptionTask";

export const TestPage = () => {
  return (
    <main className="min-h-dvh overflow-y-auto py-4 sm:px-6">
      <section className="mx-auto min-h-[calc(100dvh-2rem)] w-full max-w-6xl rounded-3xl border-4 border-(--default-border) px-4 py-2">
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

        <ChooseOptionTask
          title="Выберите подходящие варианты"
          items={[
            {
              id: "fitness",
              before: "Mathew wants to be fit so he decided to go to the",
              after: ".",
              options: [
                { id: "walk", label: "walk" },
                { id: "gym", label: "gym" },
                { id: "school", label: "school" },
              ],
            },
            {
              id: "happier",
              before: "Sometimes rich people aren't happier than",
              after: "ones.",
              options: [
                { id: "poor", label: "poor" },
                { id: "polite", label: "polite" },
                { id: "nice", label: "nice" },
              ],
            },
          ]}
        />
      </section>
    </main>
  );
};
