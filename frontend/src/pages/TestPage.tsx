import { ProgressBar } from "../widgets/ProgressBar";
import { FillInTheBlanksTask } from "../widgets/FillInTheBlanksTask";
import { ChooseOptionTask } from "../widgets/ChooseOptionTask";
import { TrueFalseTask } from "../widgets/TrueFalseTask";
import { Button } from "../shared/ui/Button";

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

        <TrueFalseTask
          title="Укажите верны ли утверждения"
          items={[
            {
              id: "stars",
              statement:
                "Stars themselves do not twinkle. They actually shine a steady brightness.",
            },
            {
              id: "sun",
              statement: "The Sun is a star.",
            },
            {
              id: "astronauts",
              statement:
                "Astronauts do not float once they're in the International Space Station.",
            },
          ]}
        />
        <div className="mt-4 mb-2 flex justify-end">
          <Button
            buttonType="submit"
            buttonName="Далее"
            className="bg-transparent text-(--text-primary) hover:bg-(--bg-primary) hover:text-(--bg-canvas)"
          >
            <svg
              aria-hidden
              className="h-[15px] w-[135px]"
              viewBox="0 0 135 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M134.707 8.07112C135.098 7.6806 135.098 7.04743 134.707 6.65691L128.343 0.292946C127.953 -0.0975785 127.319 -0.0975785 126.929 0.292946C126.538 0.68347 126.538 1.31664 126.929 1.70716L132.586 7.36401L126.929 13.0209C126.538 13.4114 126.538 14.0446 126.929 14.4351C127.319 14.8256 127.953 14.8256 128.343 14.4351L134.707 8.07112ZM0 7.36401V8.36401H134V7.36401V6.36401H0V7.36401Z"
                fill="currentColor"
              />
            </svg>
          </Button>
        </div>
      </section>
    </main>
  );
};
