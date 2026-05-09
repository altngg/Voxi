import { Navigate, useLocation } from "react-router-dom";
import type { TestResultScores } from "../shared/api/test-result";
import { CircularPercentGauge } from "../widgets/CircularPercentGauge";

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
    <main className="box-border flex min-h-full w-full flex-col items-center justify-center overflow-y-auto mt-5 mb-5">
      <section className="w-full rounded-3xl border-4 border-(--default-border) mx-5 py-8 text-(--text-primary) sm:px-8 sm:py-10">
        <h1 className="mb-4 text-center text-xl font-bold">Результаты теста</h1>

        <div className="flex flex-col items-center gap-12">
          <div className="flex w-full flex-col items-center text-center md:w-auto md:max-w-[min(100%,28rem)] md:flex-1 md:items-start md:text-left">
            <p className="mb-3 text-lg font-medium md:text-xl">Общий уровень</p>
            <p className="wrap-break-word text-6xl font-bold leading-[1.05] tracking-tight sm:text-7xl md:text-8xl lg:text-9xl">
              {overallLevel}
            </p>
          </div>

          <div
            className="flex shrink-0 flex-row flex-wrap items-start justify-center gap-10 sm:gap-14 md:justify-end"
            role="group"
            aria-label="Баллы по разделам"
          >
            <CircularPercentGauge label="Грамматика" value={grammarScore} />
            <CircularPercentGauge label="Лексика" value={vocabularyScore} />
          </div>
        </div>
      </section>
    </main>
  );
};
