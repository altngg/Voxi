import "./Input.scss";

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
    <label className={`input ${error ? "error" : ""}`}>
      <span>{title}</span>
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
      />
    </label>
  );
};
