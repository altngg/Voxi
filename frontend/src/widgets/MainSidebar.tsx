import { NavLink } from "react-router-dom";
import { cn } from "../shared/lib/cn";

import {
  BookOpen,
  ClipboardList,
  User,
  Languages,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    to: "/lesson",
    label: "Учиться",
    icon: BookOpen,
  },
  {
    to: "/test",
    label: "Пройти тест",
    icon: ClipboardList,
  },
  {
    to: "/language",
    label: "Поменять язык",
    icon: Languages,
  },
  {
    to: "/profile",
    label: "Профиль",
    icon: User,
  },
];

type MainSidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export const MainSidebar = ({ isCollapsed, onToggle }: MainSidebarProps) => {
  return (
    <aside
      className={cn(
        "fixed inset-y-4 left-4 z-10 flex flex-col rounded-2xl bg-(--bg-secondary) shadow-(--shadow-card) transition-all duration-300",
        isCollapsed
          ? "w-[clamp(2.75rem,8vw,3.25rem)] min-w-11"
          : "w-[clamp(8.5rem,32vw,12rem)] max-w-[calc(100vw-2rem)]",
      )}
    >
      <nav className="flex flex-1 flex-col gap-2 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-xl py-2 transition-colors",
                isCollapsed ? "justify-center px-2" : "gap-3 px-3",
                "hover:bg-(--tint-primary-soft)",
                isActive && "bg-(--tint-primary-medium)",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />

            <span
              className={cn(
                "inline-block overflow-hidden whitespace-nowrap text-base font-medium transition-[max-width,opacity,transform] duration-300 ease-out",
                isCollapsed
                  ? "max-w-0 -translate-x-1 opacity-0"
                  : "max-w-40 translate-x-0 opacity-100",
              )}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        aria-label={isCollapsed ? "Раскрыть меню" : "Свернуть меню"}
        className="m-2 flex items-center justify-center rounded-xl p-2 transition-colors hover:bg-(--tint-primary-soft)"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
};
