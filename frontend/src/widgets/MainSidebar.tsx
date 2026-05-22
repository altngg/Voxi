import { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Languages,
  User,
} from "lucide-react";

import { cn } from "../shared/lib/cn";
import { Button } from "../shared/ui/Button";
import { LanguageDialog } from "./LanguageDialog";

const leadingNavItems = [
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
] as const;

const trailingNavItems = [
  {
    to: "/profile",
    label: "Профиль",
    icon: User,
  },
] as const;

type MainSidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export const MainSidebar = ({ isCollapsed, onToggle }: MainSidebarProps) => {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageContainerRef = useRef<HTMLDivElement>(null);

  const navLinkClass = (isActive: boolean) =>
    cn(
      "flex items-center rounded-xl py-2 transition-colors",
      isCollapsed ? "justify-center px-2" : "gap-3 px-3",
      "hover:bg-(--tint-primary-soft)",
      isActive && "bg-(--tint-primary-medium)",
    );

  const navButtonClass = (isActive: boolean) =>
    cn(
      "h-auto w-full rounded-xl border-0 py-2",
      "hover:bg-(--tint-primary-soft) hover:text-(--text-primary)",
      isCollapsed ? "justify-center gap-0 px-2" : "justify-start gap-3 px-3",
      isActive && "bg-(--tint-primary-medium)",
    );

  const labelClass = cn(
    "inline-block overflow-hidden whitespace-nowrap text-base font-medium transition-[max-width,opacity,transform] duration-300 ease-out",
    isCollapsed
      ? "max-w-0 -translate-x-1 opacity-0"
      : "max-w-40 translate-x-0 opacity-100",
  );

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
        {leadingNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={labelClass}>{label}</span>
          </NavLink>
        ))}

        <div ref={languageContainerRef} className="relative">
          <Button
            variant="ghost"
            aria-haspopup="dialog"
            aria-expanded={isLanguageOpen}
            onClick={() => setIsLanguageOpen((prev) => !prev)}
            className={navButtonClass(isLanguageOpen)}
          >
            <Languages className="h-4 w-4 shrink-0" />
            <span className={labelClass}>Поменять язык</span>
          </Button>
          <LanguageDialog
            isOpen={isLanguageOpen}
            onClose={() => setIsLanguageOpen(false)}
            containerRef={languageContainerRef}
            className="absolute top-0 left-full z-20 ml-3"
          />
        </div>

        {trailingNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={labelClass}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <Button
        variant="ghost"
        aria-label={isCollapsed ? "Раскрыть меню" : "Свернуть меню"}
        onClick={onToggle}
        className={cn(
          "m-2 h-auto justify-center gap-0 rounded-xl border-0 p-2",
          "hover:bg-(--tint-primary-soft) hover:text-(--text-primary)",
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </aside>
  );
};
