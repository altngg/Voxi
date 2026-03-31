import "./LoginPage.scss";

import { Input } from "../../shared/ui/input/Input";

export const LoginPage = () => {
  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="registration-card__title">Войдите в аккаунт</h1>

        <form className="registration-form" action="#" method="post">
          <Input title="Логин:" inputName="username" inputType="text" />

          <Input title="Пароль:" inputName="password" inputType="password" />

          <button type="submit" className="outlined-button">
            <span>Войти</span>
            <span aria-hidden>→</span>
          </button>
        </form>
      </section>
    </main>
  );
};
