import React from "react";
import { useTranslation } from "react-i18next";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectWithLabelProps {
  /**
   * Label text shown above the select.
   */
  label: string;
  /**
   * Currently selected value.
   */
  value: string;
  /**
   * Callback when the selected value changes.
   */
  onChange: (value: string) => void;
  /**
   * Options to populate the select menu.
   */
  options: SelectOption[];
  /**
   * Whether the field is required. Defaults to false.
   */
  required?: boolean;
  /**
   * Additional CSS classes for the wrapper.
   */
  className?: string;
}

/**
 * SelectWithLabel renders a select element with its associated label.
 * It abstracts away the repetitive markup of label + select and makes
 * forms easier to maintain. The caller controls the selected value and
 * handles updates via the onChange callback. A placeholder option is
 * always rendered as the first entry.
 */
const SelectWithLabel: React.FC<SelectWithLabelProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  className = "",
}) => {
  const { t } = useTranslation();
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input border p-2 rounded w-full"
        required={required}
      >
        <option value="">{t("common.chooseOption")}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectWithLabel;