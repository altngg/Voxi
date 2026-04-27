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
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <nav className="flex flex-1 flex-col gap-2 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
                "hover:bg-white/10",
                isActive && "bg-white/20",
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />

            <span
              className={cn(
                "whitespace-nowrap transition-all",
                isCollapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100",
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
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    </aside>
  );
};
