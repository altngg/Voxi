import "./Input.scss";

interface FormProps {
  title: string;
  inputType: string;
  inputName: string;
  defaultValue?: string | number | readonly string[] | undefined;
}

export const Input = ({
  title,
  inputType,
  inputName,
  defaultValue,
}: FormProps) => {
  return (
    <label className="input">
      <span>{title}</span>
      <input type={inputType} name={inputName} defaultValue={defaultValue} />
    </label>
  );
};
