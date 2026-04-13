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
    <button
      type={buttonType}
      className="inline-flex h-[46px] cursor-pointer items-center justify-between gap-[50px] rounded-[50px] border-[3px] border-(--default-border) bg-(--bg-primary) px-[14px] text-(--bg-canvas) transition-colors hover:bg-transparent hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-65"
      disabled={isPending}
    >
      <span>{isPending ? "Пожалуйста, подождите..." : buttonName}</span>
      {children}
    </button>
  );
};
