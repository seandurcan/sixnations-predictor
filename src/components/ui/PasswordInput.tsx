"use client";

import Input from "@/components/ui/Input";
import { useState } from "react";

type PasswordInputProps = {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  showStrength?: boolean;
  showCriteria?: boolean;
};

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function getStrength(password: string) {
  const checks = getPasswordChecks(password);
  const score = Object.values(checks).filter(Boolean).length;

  if (!password) {
    return {
      label: "Not started",
      className: "bg-slate-200",
      width: "0%",
    };
  }

  if (score <= 2) {
    return {
      label: "Weak",
      className: "bg-red-500",
      width: "33%",
    };
  }

  if (score <= 4) {
    return {
      label: "Medium",
      className: "bg-amber-500",
      width: "66%",
    };
  }

  return {
    label: "Strong",
    className: "bg-green-600",
    width: "100%",
  };
}

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  showStrength = false,
  showCriteria = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] =
    useState(false);

  const checks =
    getPasswordChecks(value);

  const strength =
    getStrength(value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-16"
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(
              !showPassword
            )
          }
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
        >
          {showPassword
            ? "Hide"
            : "Show"}
        </button>
      </div>

      {showStrength && (
        <div>
          <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
            <div
              className={`h-full transition-all ${strength.className}`}
              style={{
                width: strength.width,
              }}
            />
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Password strength:{" "}
            <span className="font-semibold">
              {strength.label}
            </span>
          </p>
        </div>
      )}

      {showCriteria && (
        <ul className="text-xs text-slate-600 space-y-1">
          <li
            className={
              checks.minLength
                ? "text-green-700"
                : ""
            }
          >
            {checks.minLength
              ? "✓"
              : "•"}{" "}
            At least 8 characters
          </li>

          <li
            className={
              checks.uppercase
                ? "text-green-700"
                : ""
            }
          >
            {checks.uppercase
              ? "✓"
              : "•"}{" "}
            At least one uppercase letter
          </li>

          <li
            className={
              checks.lowercase
                ? "text-green-700"
                : ""
            }
          >
            {checks.lowercase
              ? "✓"
              : "•"}{" "}
            At least one lowercase letter
          </li>

          <li
            className={
              checks.number
                ? "text-green-700"
                : ""
            }
          >
            {checks.number
              ? "✓"
              : "•"}{" "}
            At least one number
          </li>

          <li
            className={
              checks.special
                ? "text-green-700"
                : ""
            }
          >
            {checks.special
              ? "✓"
              : "•"}{" "}
            At least one special character
          </li>
        </ul>
      )}
    </div>
  );
}