import { type ButtonHTMLAttributes } from "react";

import { cn } from "../lib/cn";

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  buttonName?: string;
  buttonType?: "submit" | "reset" | "button" | undefined;
  isPending?: boolean;
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
  ...rest
}: ButtonProps) => {
  const label = isPending ? "Пожалуйста, подождите..." : buttonName;

  return (
    <button
      {...rest}
      type={buttonType}
      className={cn(
        "ui-button",
        variant === "ghost" && "ui-button--ghost",
        className,
      )}
      disabled={isPending || disabled}
      onClick={onClick}
    >
      {label ? <span>{label}</span> : null}
      {children}
    </button>
  );
};
