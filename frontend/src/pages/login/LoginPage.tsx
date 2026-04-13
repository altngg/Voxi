import "./LoginPage.scss";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "../../shared/api/auth";
import { Input } from "../../shared/ui/input/Input";

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
      navigate("/registration");
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
    <main className="login-page">
      <section className="login-card">
        <h1 className="registration-card__title">Войдите в аккаунт</h1>

        <form className="registration-form" onSubmit={handleSubmit}>
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

          {error ? <p className="form-message form-message--error">{error}</p> : null}

          <button type="submit" className="outlined-button" disabled={isLoading}>
            <span>{isLoading ? "Входим..." : "Войти"}</span>
            <span aria-hidden>→</span>
          </button>
        </form>
      </section>
    </main>
  );
};
