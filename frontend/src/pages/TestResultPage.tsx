import { Navigate, useLocation } from "react-router-dom";
import type { TestResultScores } from "../shared/api/test-result";

const isTestResultScores = (value: unknown): value is TestResultScores => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.overallLevel === "string" &&
    typeof o.grammarScore === "number" &&
    typeof o.vocabularyScore === "number"
  );
};

export const TestResultPage = () => {
  const { state } = useLocation();

  if (!isTestResultScores(state)) {
    return <Navigate to="/test" replace />;
  }

  const { overallLevel, grammarScore, vocabularyScore } = state;

  return (
    <main className="box-border h-full min-h-0 overflow-y-auto pb-4 pt-0 sm:px-6">
      <div className="h-4 shrink-0" aria-hidden />
      <section className="mx-auto w-full max-w-3xl rounded-3xl border-4 border-(--default-border) px-6 py-8 text-(--text-primary)">
        <h1 className="mb-6 text-center text-2xl font-medium md:text-3xl">
          Результаты теста
        </h1>

        <dl className="space-y-5 text-lg">
          <div className="flex flex-col gap-1 rounded-[20px] border-2 border-(--default-border) p-4 sm:flex-row sm:items-center sm:justify-between">
            <dt className="font-medium text-(--text-primary)">
              Общий уровень
            </dt>
            <dd className="text-xl font-semibold tabular-nums">{overallLevel}</dd>
          </div>

          <div className="flex flex-col gap-1 rounded-[20px] border-2 border-(--default-border) p-4 sm:flex-row sm:items-center sm:justify-between">
            <dt className="font-medium">Грамматика</dt>
            <dd className="text-xl font-semibold tabular-nums">{grammarScore}</dd>
          </div>

          <div className="flex flex-col gap-1 rounded-[20px] border-2 border-(--default-border) p-4 sm:flex-row sm:items-center sm:justify-between">
            <dt className="font-medium">Лексика</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {vocabularyScore}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
};
