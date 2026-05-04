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
    label: "Продолжить учиться",
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
        "fixed inset-y-4 left-4 z-10 flex flex-col rounded-2xl bg-(--bg-secondary) transition-all duration-300",
        isCollapsed
          ? "w-[clamp(2.75rem,8vw,3.25rem)] min-w-11"
          : "w-[clamp(10rem,40vw,14rem)] max-w-[calc(100vw-2rem)]",
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
                "hover:bg-white/10",
                isActive && "bg-white/20",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />

            <span
              className={cn(
                "inline-block overflow-hidden whitespace-nowrap text-[26px] transition-[max-width,opacity,transform] duration-300 ease-out",
                isCollapsed
                  ? "max-w-0 opacity-0 -translate-x-1"
                  : "max-w-40 opacity-100 translate-x-0",
              )}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="m-2 flex items-center justify-center rounded-xl p-2 hover:bg-white/10"
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
