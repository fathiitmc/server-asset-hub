"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "danger";
};

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const classes =
    variant === "danger"
      ? "bg-red-600 text-white shadow-sm shadow-red-950/10 hover:bg-red-700 disabled:bg-red-300"
      : "bg-zinc-950 text-white shadow-sm shadow-zinc-950/15 hover:bg-zinc-800 disabled:bg-zinc-400";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition ${classes}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
