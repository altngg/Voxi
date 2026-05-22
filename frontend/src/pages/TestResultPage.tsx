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
    <main className="ui-form-page">
      <section className="ui-card w-full max-w-2xl p-6 sm:p-8">
        <h1 className="ui-page-title mb-6 text-center">Результаты теста</h1>

        <div className="flex flex-col items-center gap-8">
          <p className="wrap-break-word text-center text-5xl font-bold tracking-tight sm:text-6xl">
            {overallLevel}
          </p>

          <div
            className="flex shrink-0 flex-row flex-wrap items-start justify-center gap-6 sm:gap-10"
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
