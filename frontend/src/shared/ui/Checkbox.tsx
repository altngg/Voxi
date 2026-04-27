import { cn } from "../lib/cn";

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
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="peer sr-only"
      />
      <span className="grid h-4 w-4 place-items-center rounded-[4px] border-2 border-(--default-border) bg-transparent transition-colors peer-checked:bg-(--default-border)">
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="h-3 w-3 opacity-0 transition-opacity peer-checked:opacity-100"
        >
          <path
            d="M6.4 11.2 3.3 8.1l-1.1 1.1 4.2 4.2 7.4-7.4-1.1-1.1z"
            fill="var(--bg-canvas)"
          />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  );
};
