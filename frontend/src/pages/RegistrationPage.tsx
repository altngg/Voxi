import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "../shared/ui/Input";
import { Button } from "../shared/ui/Button";
import type { RegistrationDraft } from "./registrationFlow";

export const RegistrationPage = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordRepeat, setPasswordRepeat] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isPasswordMismatch =
    passwordRepeat.length > 0 && password !== passwordRepeat;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPasswordMismatch) {
      setErrorMessage("Пароли не совпадают");
      return;
    }

    const registrationDraft: RegistrationDraft = {
      login,
      email,
      password,
    };

    navigate("/registration/language", {
      state: { registrationDraft },
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
          />

          <Input
            title="Укажите вашу почту:"
            inputName="registerEmail"
            inputType="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />

          <Input
            title="Придумайте пароль:"
            inputName="registerPassword"
            inputType="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
          />

          <Input
            title="Повторите пароль:"
            inputName="passwordRepeat"
            inputType="password"
            value={passwordRepeat}
            onChange={setPasswordRepeat}
            autoComplete="new-password"
            required
            error={isPasswordMismatch}
          />
          {errorMessage ? (
            <p className="my-2 mb-[10px] text-[20px] leading-[1.3] text-(--danger)">
              {errorMessage}
            </p>
          ) : null}

          <Button buttonType="submit" buttonName="Выбрать язык">
            <span aria-hidden>→</span>
          </Button>
        </form>
      </section>
    </main>
  );
};
