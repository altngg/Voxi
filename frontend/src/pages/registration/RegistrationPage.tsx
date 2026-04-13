import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "../../shared/api/auth";
import { Input } from "../../shared/ui/input/Input";
// import { Combobox } from "../../shared/ui/combobox/Combobox";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../shared/ui/button/Button";

// const languageOptions = [
//   "Русский",
//   "Английский",
//   "Немецкий",
//   "Французский",
//   "Испанский",
// ];
// const levelOptions = ["A1", "A2", "B1", "B2", "C1", "C2", "Не знаю"];

interface RegisterData {
  login: string;
  email: string;
  password: string;
  learningLanguageId?: number;
}

interface RegisterResponse {
  message: string;
}

export const RegistrationPage = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordRepeat, setPasswordRepeat] = useState<string>("");
  // const [targetLanguage, setTargetLanguage] = useState<string>("");
  // const [languageLevel, setLanguageLevel] = useState("Не знаю");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const isPasswordMismatch =
    passwordRepeat.length > 0 && password !== passwordRepeat;

  // const selectedLearningLanguageId = useMemo(() => {
  //   const selectedIndex = languageOptions.findIndex(
  //     (language) => language === targetLanguage,
  //   );
  //   return selectedIndex > 0 ? selectedIndex : undefined;
  // }, [targetLanguage]);

  const {
    mutate: register,
    isPending,
    error: mutationError,
  } = useMutation<RegisterResponse, Error, RegisterData>({
    mutationFn: (userData) => authApi.register(userData),
    onSuccess: (response) => {
      setSuccess(response.message || "Регистрация прошла успешно");
      navigate("/login");
    },
    onError: (submitError) => {
      setErrorMessage(
        submitError instanceof Error
          ? submitError.message
          : "Ошибка при регистрации",
      );
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    register({
      login,
      email,
      password,
    });
  };

  return (
    <main className="flex min-h-full items-center justify-center">
      <section className="w-[600px] rounded-[50px] border-4 border-(--default-border) p-4">
        <h1 className="mb-[10px] text-center text-[40px] font-bold">
          Регистрация
        </h1>

        <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            title="Введите имя пользователя:"
            inputName="login"
            inputType="text"
            value={login}
            onChange={setLogin}
            autoComplete="username"
            required
            disabled={isPending}
          />

          <Input
            title="Укажите вашу почту:"
            inputName="registerEmail"
            inputType="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            disabled={isPending}
          />

          <Input
            title="Придумайте пароль:"
            inputName="registerPassword"
            inputType="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            disabled={isPending}
          />

          <Input
            title="Повторите пароль:"
            inputName="passwordRepeat"
            inputType="password"
            value={passwordRepeat}
            onChange={setPasswordRepeat}
            autoComplete="new-password"
            required
            disabled={isPending}
            error={isPasswordMismatch}
          />

          {/* <Combobox
            title="Какой язык вы хотите изучать?"
            name="targetLanguage"
            options={languageOptions}
            value={targetLanguage}
            onChange={setTargetLanguage}
            disabled={isPending}
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
                  disabled={isPending}
                />
                <span>{level}</span>
              </label>
            ))}
          </div> */}

          {mutationError ? (
            <p className="my-2 mb-[10px] text-[20px] leading-[1.3] text-(--danger)">
              {errorMessage}
            </p>
          ) : null}
          {success ? (
            <p className="my-2 mb-[10px] text-[20px] leading-[1.3] text-(--success)">
              {success}
            </p>
          ) : null}

          <Button
            buttonType="submit"
            isPending={isPending}
            buttonName="Завершить регистрацию"
          >
            <span aria-hidden>→</span>
          </Button>
        </form>
      </section>
    </main>
  );
};
