import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Languages as LanguagesIcon,
  LogOut,
  Mail,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

import { authApi } from "../shared/api/auth";
import { usersApi, type UserProfile } from "../shared/api/users";
import { Button } from "../shared/ui/Button";

const LANGUAGE_NAMES: Record<number, string> = {
  1: "Английский",
  2: "Немецкий",
  3: "Французский",
  4: "Испанский",
};

const ROLE_LABELS: Record<string, string> = {
  USER: "Пользователь",
  ADMIN: "Администратор",
};

const formatRole = (role: string) => ROLE_LABELS[role] ?? role;

const formatLanguage = (id: number) => LANGUAGE_NAMES[id] ?? `Язык #${id}`;

const formatJoinDate = (raw?: string) => {
  if (!raw) {
    return "—";
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getInitials = (login: string) => {
  const trimmed = login.trim();
  if (!trimmed) {
    return "?";
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
};

type StatCardProps = {
  label: string;
  value: number | string;
  icon: React.ReactNode;
};

const StatCard = ({ label, value, icon }: StatCardProps) => (
  <div className="flex items-center gap-4 rounded-2xl border-[3px] border-(--default-border) px-5 py-4">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--bg-secondary) text-(--text-primary)">
      {icon}
    </div>
    <div className="flex min-w-0 flex-col">
      <span className="text-2xl font-bold leading-none tabular-nums">
        {value}
      </span>
      <span className="mt-1 truncate text-base text-(--text-secondary)">
        {label}
      </span>
    </div>
  </div>
);

type InfoRowProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const InfoRow = ({ label, value, icon }: InfoRowProps) => (
  <div className="flex items-center gap-3">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--bg-secondary) text-(--text-primary)">
      {icon}
    </span>
    <div className="flex min-w-0 flex-col">
      <span className="text-sm text-(--text-secondary)">{label}</span>
      <span className="truncate text-lg font-medium">{value}</span>
    </div>
  </div>
);

type ProfileContentProps = {
  user: UserProfile;
};

const ProfileContent = ({ user }: ProfileContentProps) => {
  const navigate = useNavigate();

  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      try {
        localStorage.removeItem("authUser");
      } catch {
        // localStorage may be unavailable
      }
      navigate("/login", { replace: true });
    },
  });

  const learningLanguages = user.learningLanguages ?? [];
  const testResults = user.testResults ?? [];
  const doneTasks = user.doneTasks ?? [];

  return (
    <main className="box-border h-full min-h-0 overflow-y-auto pb-4 sm:px-6">
      <div className="h-4 shrink-0" aria-hidden />
      <section className="mx-auto w-full max-w-4xl rounded-3xl border-4 border-(--default-border) px-6 py-6">
        <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <div
            aria-hidden
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-(--bg-primary) text-3xl font-bold text-(--bg-canvas)"
          >
            {getInitials(user.login)}
          </div>
          <div className="flex min-w-0 flex-col">
            <h1 className="break-words text-3xl font-bold leading-tight">
              {user.login}
            </h1>
            <p className="mt-1 break-all text-base text-(--text-secondary)">
              {user.email}
            </p>
          </div>
        </header>

        <hr className="my-6 border-t-2 border-(--default-border) opacity-40" />

        <section
          aria-label="Данные аккаунта"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <InfoRow
            label="Почта"
            value={user.email}
            icon={<Mail className="h-5 w-5" />}
          />
          <InfoRow
            label="Роль"
            value={formatRole(user.role)}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <InfoRow
            label="В Voxi с"
            value={formatJoinDate(user.createdAt)}
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <InfoRow
            label="ID пользователя"
            value={`#${user.id}`}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </section>

        <section aria-label="Статистика" className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">Статистика</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="Пройдено тестов"
              value={testResults.length}
              icon={<ClipboardList className="h-6 w-6" />}
            />
            <StatCard
              label="Выполнено заданий"
              value={doneTasks.length}
              icon={<BookOpen className="h-6 w-6" />}
            />
            <StatCard
              label="Изучаемых языков"
              value={learningLanguages.length}
              icon={<LanguagesIcon className="h-6 w-6" />}
            />
          </div>
        </section>

        <section aria-label="Изучаемые языки" className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">Изучаемые языки</h2>
          {learningLanguages.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {learningLanguages.map((languageId) => (
                <li
                  key={languageId}
                  className="rounded-full border-[3px] border-(--default-border) px-4 py-1 text-base font-medium text-(--text-primary)"
                >
                  {formatLanguage(languageId)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-(--text-secondary)">
              Вы ещё не выбрали язык для изучения.
            </p>
          )}
        </section>

        <div className="mt-8 flex justify-end">
          <Button
            buttonType="button"
            buttonName="Выйти"
            isPending={isLoggingOut}
            onClick={() => logout()}
            className="bg-transparent text-(--text-primary) hover:bg-(--bg-primary) hover:text-(--bg-canvas)"
          >
            <LogOut className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </section>
    </main>
  );
};

export const ProfilePage = () => {
  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ["users", "me"],
    queryFn: usersApi.me,
  });

  if (isPending) {
    return (
      <main className="flex min-h-full items-center justify-center px-4">
        <p className="text-lg text-(--text-primary)">Загружаем профиль...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-full items-center justify-center px-4">
        <section className="flex max-w-md flex-col items-center gap-4 rounded-2xl border-4 border-(--default-border) p-6 text-center">
          <h1 className="text-2xl font-bold">Не удалось загрузить профиль</h1>
          <p className="text-base text-(--text-secondary)">
            {error instanceof Error
              ? error.message
              : "Попробуйте обновить страницу позже."}
          </p>
          <Button
            buttonType="button"
            buttonName="Повторить"
            isPending={isFetching}
            onClick={() => refetch()}
          />
        </section>
      </main>
    );
  }

  return <ProfileContent user={data} />;
};
