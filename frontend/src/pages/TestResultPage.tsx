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
    <main className="flex min-h-full w-full items-center justify-center">
      <section className="w-full max-w-2xl rounded-2xl border-4 border-(--default-border) p-5 shadow-sm sm:p-6">
        <h1 className="text-center text-lg font-bold">Результаты теста</h1>

        <div className="flex flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center text-center md:w-auto md:max-w-[min(100%,24rem)] md:flex-1 md:items-start md:text-left">
            <p className="wrap-break-word text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {overallLevel}
            </p>
          </div>

          <div
            className="flex shrink-0 flex-row flex-wrap items-start justify-center gap-6 sm:gap-8 md:justify-end"
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
