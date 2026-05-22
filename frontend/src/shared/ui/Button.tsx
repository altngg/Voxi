import { cn } from "../lib/cn";

interface FormProps {
  buttonName?: string;
  buttonType?: "submit" | "reset" | "button" | undefined;
  isPending?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "ghost";
}

export const Button = ({
  buttonName,
  buttonType = "button",
  isPending = false,
  disabled = false,
  onClick,
  children,
  className,
  variant = "primary",
}: FormProps) => {
  return (
    <button
      type={buttonType}
      className={cn(
        "ui-button",
        variant === "ghost" && "ui-button--ghost",
        className,
      )}
      disabled={isPending || disabled}
      onClick={onClick}
    >
      <span>{isPending ? "Пожалуйста, подождите..." : buttonName}</span>
      {children}
    </button>
  );
};
