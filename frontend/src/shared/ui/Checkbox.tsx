import { cn } from "../lib/cn";
import { Check } from "lucide-react";

type CheckboxProps = {
  name: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  labelClassName?: string;
};

export const Checkbox = ({
  name,
  label,
  checked = false,
  disabled = false,
  onChange,
  labelClassName,
}: CheckboxProps) => {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 text-lg font-medium text-(--text-primary)",
        disabled && "cursor-not-allowed opacity-60",
        labelClassName,
      )}
    >
      <span className="relative inline-grid h-4 w-4 shrink-0 place-items-center">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.checked)}
          className={cn(
            "peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0",
            disabled && "cursor-not-allowed",
          )}
        />
        <span
          className={cn(
            "pointer-events-none grid h-4 w-4 place-items-center rounded-[4px] border-2 border-(--default-border) bg-transparent transition-colors",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-(--default-border) peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-(--bg-canvas)",
            checked && "bg-(--default-border)",
          )}
        >
          <Check
            aria-hidden="true"
            className={cn(
              "h-3 w-3 text-(--bg-canvas) transition-opacity",
              checked ? "opacity-100" : "opacity-0",
            )}
          />
        </span>
      </span>
      <span>{label}</span>
    </label>
  );
};
