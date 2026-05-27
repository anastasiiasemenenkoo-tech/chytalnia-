"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { useDict } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Password input with an inline eye-icon toggle. Otherwise behaves like
 * the shadcn <Input/> primitive — forwards every standard prop.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  const dict = useDict();
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? dict.auth.hidePassword : dict.auth.showPassword}
        aria-pressed={visible}
        tabIndex={-1}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md focus-visible:outline-none focus-visible:ring-2"
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}
