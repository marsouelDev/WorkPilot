"use client";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface Props {
  value?: string;
  onChange: (value: string | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function PhoneField({
  value,
  onChange,
  className,
  placeholder = "Numéro de téléphone",
  disabled = false,
}: Props) {
  return (
    <PhoneInput
      international
      defaultCountry="CM"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}