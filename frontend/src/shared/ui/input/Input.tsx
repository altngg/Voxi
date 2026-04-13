interface FormProps {
  title: string;
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
}: FormProps) => {
  return (
    <label className="block">
      <span className="mb-[6px] block">{title}</span>
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
        className={`mb-[6px] h-[45px] w-full rounded-[50px] border-[3px] bg-transparent px-4 text-(--text-secondary) outline-none ${
          error
            ? "border-(--danger) hover:border-(--danger) focus:border-(--danger)"
            : "border-(--default-border)"
        }`}
      />
    </label>
  );
};
