import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "../shared/api/auth";
import { Input } from "../shared/ui/Input";
import { Button } from "../shared/ui/Button";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });
      localStorage.setItem("authUser", JSON.stringify(response.user));
      navigate("/lesson");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Не удалось выполнить вход";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="ui-form-page">
      <section className="ui-card-form w-full max-w-[600px]">
        <h1 className="ui-form-title mb-4">Войдите в аккаунт</h1>

        <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            title="Email:"
            inputName="email"
            inputType="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            disabled={isLoading}
          />

          <Input
            title="Пароль:"
            inputName="password"
            inputType="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
            disabled={isLoading}
          />

          {error ? (
            <p className="mt-2 text-base leading-snug text-(--danger)">
              {error}
            </p>
          ) : null}

          <Button buttonType="submit" isPending={isLoading} buttonName="Войти">
            <span aria-hidden>→</span>
          </Button>
        </form>
      </section>
    </main>
  );
};
