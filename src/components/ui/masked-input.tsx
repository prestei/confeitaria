"use client";

import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { maskMoney, maskPhone } from "@/lib/utils";

type MaskedInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  kind: "phone" | "money";
};

export function MaskedInput({
  kind,
  value,
  defaultValue,
  onChange,
  placeholder,
  inputMode,
  autoComplete,
  ...props
}: MaskedInputProps) {
  const mask = kind === "money" ? maskMoney : maskPhone;
  const controlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(() =>
    mask(defaultValue == null ? "" : String(defaultValue)),
  );
  const shown = controlled ? mask(String(value)) : uncontrolled;

  const { className, ...rest } = props;

  return (
    <input
      className={cn("input", className)}
      {...rest}
      inputMode={inputMode ?? (kind === "money" ? "decimal" : "tel")}
      autoComplete={
        autoComplete ?? (kind === "phone" ? "tel" : undefined)
      }
      placeholder={
        placeholder ?? (kind === "money" ? "0,00" : "(11) 99999-9999")
      }
      value={shown}
      onChange={(e) => {
        const next = mask(e.target.value);
        if (!controlled) setUncontrolled(next);
        e.target.value = next;
        onChange?.(e);
      }}
    />
  );
}
