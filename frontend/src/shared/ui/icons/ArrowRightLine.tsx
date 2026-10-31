import { cn } from "../../lib/cn";

type ArrowRightLineProps = {
  className?: string;
};

export const ArrowRightLine = ({ className }: ArrowRightLineProps) => (
  <svg
    aria-hidden
    className={cn("h-[15px] w-[135px]", className)}
    viewBox="0 0 135 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M134.707 8.07112C135.098 7.6806 135.098 7.04743 134.707 6.65691L128.343 0.292946C127.953 -0.0975785 127.319 -0.0975785 126.929 0.292946C126.538 0.68347 126.538 1.31664 126.929 1.70716L132.586 7.36401L126.929 13.0209C126.538 13.4114 126.538 14.0446 126.929 14.4351C127.319 14.8256 127.953 14.8256 128.343 14.4351L134.707 8.07112ZM0 7.36401V8.36401H134V7.36401V6.36401H0V7.36401Z"
      fill="currentColor"
    />
  </svg>
);
