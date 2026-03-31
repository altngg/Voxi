import "./Combobox.scss";

interface ComboboxProps {
  title: string;
  name: string;
  defaultValue?: string | number | readonly string[] | undefined;
  options: string[] | number[];
}

export const Combobox = ({
  title,
  name,
  defaultValue,
  options,
}: ComboboxProps) => {
  return (
    <label className="combobox">
      <span>{title}</span>
      <select name={name} defaultValue={defaultValue || ""}>
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
