import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import { authApi } from "../shared/api/auth";
import { Button } from "../shared/ui/Button";
import { Combobox } from "../shared/ui/Combobox";
import type { RegistrationDraft } from "./registrationFlow";

type LocationState = {
  registrationDraft?: RegistrationDraft;
};

const languageOptions = [
  { id: 1, name: "Английский" },
  { id: 2, name: "Немецкий" },
  { id: 3, name: "Французский" },
  { id: 4, name: "Испанский" },
];

const levelOptions = ["A1", "A2", "B1", "B2", "C1", "C2", "Не знаю"];

const LEVEL_BUTTON_CLASS =
  "min-w-[128px] justify-center gap-0 px-5 text-base font-medium";

export const RegistrationLanguagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [targetLanguage, setTargetLanguage] = useState<string>(
    languageOptions[0].name,
  );
  const [languageLevel, setLanguageLevel] = useState<string>("Не знаю");
  const [error, setError] = useState<string>("");
  const { mutate: register, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      navigate(languageLevel === "Не знаю" ? "/test" : "/");
    },
    onError: (submitError) => {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Ошибка при регистрации";
      setError(message);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!state?.registrationDraft) {
      setError("Сначала заполните регистрационные данные.");
      return;
    }

    const selectedLanguage = languageOptions.find(
      (language) => language.name === targetLanguage,
    );

    register({
      ...state.registrationDraft,
      learningLanguages: [selectedLanguage?.id ?? languageOptions[0].id],
    });
  };

  return (
    <main className="ui-form-page">
      <section className="ui-card-form w-full max-w-[600px]">
        <h1 className="ui-form-title mb-4">Выбор языка</h1>

        <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          <Combobox
            title="Какой язык вы хотите изучать?"
            name="targetLanguage"
            options={languageOptions.map((language) => language.name)}
            value={targetLanguage}
            onChange={setTargetLanguage}
            disabled={isPending}
          />

          <div>
            <p className="mb-2 text-base">Укажите ваш уровень языка</p>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {levelOptions.map((level) => (
                <Button
                  key={level}
                  buttonName={level}
                  variant={languageLevel === level ? "primary" : "ghost"}
                  onClick={() => setLanguageLevel(level)}
                  className={LEVEL_BUTTON_CLASS}
                />
              ))}
            </div>
          </div>

          {error ? (
            <p className="mt-2 text-base leading-snug text-(--danger)">
              {error}
            </p>
          ) : null}

          <Button
            buttonType="submit"
            isPending={isPending}
            buttonName={
              languageLevel === "Не знаю"
                ? "Перейти к тесту"
                : "Завершить регистрацию"
            }
          >
            <span aria-hidden>→</span>
          </Button>
        </form>
      </section>
    </main>
  );
};
