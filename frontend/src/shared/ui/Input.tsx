import { cn } from "../lib/cn";

interface FormProps {
  title?: string;
  inputType: string;
  inputName: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string | number | readonly string[] | undefined;
  error?: boolean;
  labelClassName?: string;
  inputClassName?: string;
  ariaLabel?: string;
}

export const Input = ({
  title,
  inputType,
  inputName,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  disabled,
  defaultValue,
  error = false,
  labelClassName,
  inputClassName,
  ariaLabel,
}: FormProps) => {
  return (
    <label className={cn("block", labelClassName)}>
      {title ? <span className="mb-[6px] block">{title}</span> : null}
      <input
        type={inputType}
        name={inputName}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        aria-label={ariaLabel}
        className={cn(
          "mb-[6px] h-[45px] w-full rounded-[50px] border-[3px] bg-transparent px-4 text-(--text-primary) outline-none",
          error
            ? "border-(--danger) hover:border-(--danger) focus:border-(--danger)"
            : "border-(--default-border)",
          inputClassName,
        )}
      />
    </label>
  );
};
