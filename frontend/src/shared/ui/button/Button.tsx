import "./Button.scss";

interface FormProps {
  buttonName?: string;
  buttonType?: "submit" | "reset" | "button" | undefined;
  isPending?: boolean;
  children?: React.ReactNode;
}

// TODO: расширить для других видов кнопок

export const Button = ({
  buttonName,
  buttonType = "button",
  isPending = false,
  children,
}: FormProps) => {
  return (
    <button type={buttonType} className="button" disabled={isPending}>
      <span>{isPending ? "Пожалуйста, подождите..." : buttonName}</span>
      {children}
    </button>
  );
};
