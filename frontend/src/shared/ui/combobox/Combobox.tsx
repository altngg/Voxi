import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface ComboboxProps {
  title: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  options: string[] | number[];
}

export const Combobox = ({
  title,
  name,
  value,
  onChange,
  disabled,
  options,
}: ComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as HTMLElement)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string | number) => {
    setIsOpen(false);
    onChange?.(String(option));
  };

  const displayValue = value ?? options[0] ?? "";

  if (disabled) {
    return (
      <label className="pointer-events-none block opacity-50">
        <span className="mb-[6px] block">{title}</span>
        <div className="h-[45px] rounded-[25px] border-[3px] border-(--default-border) bg-[#f9fafb] px-4 leading-[41px] text-[#9ca3af]">
          {displayValue || "не выбрано"}
        </div>
      </label>
    );
  }

  return (
    <label
      className="block"
      ref={containerRef}
    >
      <span className="mb-[6px] block">{title}</span>
      <div className="relative">
        <button
          type="button"
          className={`flex h-[45px] w-full cursor-pointer items-center justify-between border-[3px] bg-transparent px-4 text-(--text-secondary) transition-[border-color,box-shadow] duration-200 hover:border-(--bg-primary) hover:shadow-[0_0_0_3px_rgba(112,102,204,0.15)] focus:border-(--bg-primary) focus:shadow-[0_0_0_3px_rgba(112,102,204,0.15)] ${
            isOpen
              ? "rounded-t-[25px] rounded-b-none border-(--default-border) border-b-transparent"
              : "rounded-[25px] border-(--default-border)"
          }`}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="mr-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {displayValue}
          </span>
          <ChevronDown
            className={`h-[30px] w-[30px] shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <ul
            className="absolute inset-x-0 top-full z-100 max-h-[200px] list-none overflow-y-auto rounded-b-[25px] border-[3px] border-t-0 border-(--default-border) bg-(--bg-canvas) p-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            role="listbox"
          >
            {options.map((option) => {
              const isSelected = String(option) === String(value);
              return (
                <li
                  key={option}
                  className={`cursor-pointer px-4 py-[10px] text-(--text-secondary) transition-[background,color] duration-120 hover:bg-[rgba(112,102,204,0.08)] hover:text-(--text-primary) ${
                    isSelected
                      ? "bg-[rgba(112,102,204,0.12)] font-semibold text-(--bg-primary)"
                      : ""
                  }`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(option);
                  }}
                >
                  {option}
                </li>
              );
            })}
          </ul>
        )}

        <input type="hidden" name={name} value={value || ""} />
      </div>
    </label>
  );
};
