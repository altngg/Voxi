import "./RegistrationPage.scss";

import { Input } from "../../shared/ui/input/Input";
import { Combobox } from "../../shared/ui/combobox/Combobox";

const languageOptions = [
  "",
  "Английский",
  "Немецкий",
  "Французский",
  "Испанский",
];
const levelOptions = ["A1", "A2", "B1", "B2", "C1", "C2", "Не знаю"];

export const RegistrationPage = () => {
  return (
    <main className="registration-page">
      <section className="registration-card">
        <h1 className="registration-card__title">Регистрация</h1>

        <form className="registration-form" action="#" method="post">
          <Input
            title="Введите имя пользователя:"
            inputName="username"
            inputType="text"
            defaultValue="sobaka"
          />

          <Input
            title="Укажите вашу почту:"
            inputName="email"
            inputType="email"
            defaultValue="sobaka@gmail.com"
          />

          <Input
            title="Придумайте пароль:"
            inputName="password"
            inputType="password"
          />

          <Input
            title="Повторите пароль:"
            inputName="passwordRepeat"
            inputType="password"
          />

          <Combobox
            title="Какие языки вы уже знаете?"
            name="knownLanguage"
            options={languageOptions}
          />

          <Combobox
            title="Какой язык вы хотите изучать?"
            name="targetLanguage"
            options={languageOptions}
          />

          <p>Укажите ваш уровень языка</p>
          <div className="registration-form__levels-list">
            {levelOptions.map((level) => (
              <div key={level} className="level-chip">
                <input
                  type="radio"
                  name="languageLevel"
                  value={level}
                  defaultChecked={level === "B2"}
                />
                <span>{level}</span>
              </div>
            ))}
          </div>

          <button type="submit" className="outlined-button">
            <span>Завершить регистрацию</span>
            <span aria-hidden>→</span>
          </button>

          <p>Не знаете свой уровень?</p>

          <button type="button" className="outlined-button">
            <span>Завершить регистрацию и пройти тест</span>
            <span aria-hidden>→</span>
          </button>
        </form>
      </section>
    </main>
  );
};
