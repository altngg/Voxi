import "./Combobox.scss";

interface ComboboxProps {
  title: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  defaultValue?: string | number | readonly string[] | undefined;
  options: string[] | number[];
}

export const Combobox = ({
  title,
  name,
  value,
  onChange,
  disabled,
  defaultValue,
  options,
}: ComboboxProps) => {
  return (
    <label className="combobox">
      <span>{title}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        defaultValue={defaultValue || ""}
      >
        {options.map((option) => (
          <option
            key={option || "placeholder"}
            value={option}
            disabled={!option}
          >
            {option || ""}
          </option>
        ))}
      </select>
    </label>
  );
};
