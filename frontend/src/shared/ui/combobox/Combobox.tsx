import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import "./Combobox.scss";

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
      <label className="combobox combobox--disabled">
        <span>{title}</span>
        <div className="combobox-input">{displayValue || "не выбрано"}</div>
      </label>
    );
  }

  return (
    <label
      className={`combobox ${isOpen ? "combobox--open" : ""}`}
      ref={containerRef}
    >
      <span>{title}</span>
      <div className="combobox-wrapper">
        <button
          type="button"
          className="combobox-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="combobox-value">{displayValue}</span>
          <ChevronDown className={`combobox-icon ${isOpen ? "open" : ""}`} />
        </button>

        {isOpen && (
          <ul className="combobox-dropdown" role="listbox">
            {options.map((option) => {
              const isSelected = String(option) === String(value);
              return (
                <li
                  key={option}
                  className={`combobox-option ${isSelected ? "selected" : ""}`}
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
