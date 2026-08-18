"use client";

import { InputHTMLAttributes } from "react";

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: string;
  onChange: (rawValue: string) => void;
}

export function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
  const display = value ? Number(value).toLocaleString("es-CO") : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\./g, "").replace(/\D/g, "");
    onChange(raw);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onKeyDown={(e) => {
        if (e.key === "-" || e.key === "e" || e.key === "," ) e.preventDefault();
      }}
      className={className}
      {...props}
    />
  );
}
