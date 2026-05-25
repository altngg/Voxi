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
      {title ? (
        <span className="mb-[6px] block text-base">{title}</span>
      ) : null}
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
        data-error={error ? "true" : undefined}
        className={cn("ui-input", inputClassName)}
      />
    </label>
  );
};
