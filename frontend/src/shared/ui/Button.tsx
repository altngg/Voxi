import { cn } from "../lib/cn";

interface FormProps {
  buttonName?: string;
  buttonType?: "submit" | "reset" | "button" | undefined;
  isPending?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

// TODO: расширить для других видов кнопок

export const Button = ({
  buttonName,
  buttonType = "button",
  isPending = false,
  onClick,
  children,
  className,
}: FormProps) => {
  return (
    <button
      type={buttonType}
      className={cn(
        "inline-flex h-[46px] cursor-pointer items-center justify-between gap-[50px] rounded-[50px] border-[3px] border-(--default-border) bg-(--bg-primary) px-[14px] text-(--bg-canvas) transition-colors hover:bg-transparent hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-65",
        className,
      )}
      disabled={isPending}
      onClick={onClick}
    >
      <span>{isPending ? "Пожалуйста, подождите..." : buttonName}</span>
      {children}
    </button>
  );
};
