import "./RegistrationPage.scss";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "../../shared/api/auth";
import { Input } from "../../shared/ui/input/Input";
import { Combobox } from "../../shared/ui/combobox/Combobox";

const languageOptions = [
  "Русский",
  "Английский",
  "Немецкий",
  "Французский",
  "Испанский",
];
const levelOptions = ["A1", "A2", "B1", "B2", "C1", "C2", "Не знаю"];

export const RegistrationPage = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordRepeat, setPasswordRepeat] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState<string>("");
  const [languageLevel, setLanguageLevel] = useState("Не знаю");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const isPasswordMismatch =
    passwordRepeat.length > 0 && password !== passwordRepeat;

  const selectedLearningLanguageId = useMemo(() => {
    const selectedIndex = languageOptions.findIndex(
      (language) => language === targetLanguage,
    );
    return selectedIndex > 0 ? selectedIndex : undefined;
  }, [targetLanguage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // change later
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== passwordRepeat) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      setIsLoading(true);
      const response = await authApi.register({
        login,
        email,
        password,
        learningLanguageId: selectedLearningLanguageId,
      });
      setSuccess(response.message || "Регистрация прошла успешно");
      navigate("/login");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Ошибка при регистрации";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="registration-page">
      <section className="registration-card">
        <h1 className="registration-card__title">Регистрация</h1>

        <form className="registration-form" onSubmit={handleSubmit}>
          <Input
            title="Введите имя пользователя:"
            inputName="login"
            inputType="text"
            value={login}
            onChange={setLogin}
            autoComplete="username"
            required
            disabled={isLoading}
          />

          <Input
            title="Укажите вашу почту:"
            inputName="registerEmail"
            inputType="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            disabled={isLoading}
          />

          <Input
            title="Придумайте пароль:"
            inputName="registerPassword"
            inputType="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            disabled={isLoading}
          />

          <Input
            title="Повторите пароль:"
            inputName="passwordRepeat"
            inputType="password"
            value={passwordRepeat}
            onChange={setPasswordRepeat}
            autoComplete="new-password"
            required
            disabled={isLoading}
            error={isPasswordMismatch}
          />

          <Combobox
            title="Какой язык вы хотите изучать?"
            name="targetLanguage"
            options={languageOptions}
            value={targetLanguage}
            onChange={setTargetLanguage}
            disabled={isLoading}
          />

          <p>Укажите ваш уровень языка</p>
          <div className="registration-form__levels-list">
            {levelOptions.map((level) => (
              <label key={level} className="level-chip">
                <input
                  type="radio"
                  name="languageLevel"
                  value={level}
                  checked={languageLevel === level}
                  onChange={(event) => setLanguageLevel(event.target.value)}
                  disabled={isLoading}
                />
                <span>{level}</span>
              </label>
            ))}
          </div>

          {error ? (
            <p className="form-message form-message--error">{error}</p>
          ) : null}
          {success ? (
            <p className="form-message form-message--success">{success}</p>
          ) : null}

          <button
            type="submit"
            className="outlined-button"
            disabled={isLoading}
          >
            <span>
              {isLoading
                ? "Пожалуйста, подождите..."
                : languageLevel === "Не знаю"
                  ? "Завершить регистрацию и пройти тест"
                  : "Завершить регистрацию"}
            </span>
            <span aria-hidden>→</span>
          </button>
        </form>
      </section>
    </main>
  );
};
