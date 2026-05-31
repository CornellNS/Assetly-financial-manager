import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import {
  controlFocusVisibleRing,
  controlSurface,
  focusVisibleRing,
  labelText,
} from "@/lib/theme";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)]",
    secondary:
      "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground-soft)] shadow-sm hover:border-[var(--muted-soft)] hover:bg-[var(--paper-subtle)]",
    ghost:
      "border-transparent bg-transparent text-[var(--muted)] hover:bg-[var(--paper-muted)] hover:text-[var(--foreground)]",
    danger:
      "border-[var(--danger-line)] bg-[var(--danger-surface)] text-[var(--danger)] hover:text-[var(--danger-hover)]",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-3.5 text-sm",
    icon: "h-8 w-8 p-0",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-medium transition duration-150 disabled:pointer-events-none disabled:opacity-50",
        focusVisibleRing,
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

type CardHeaderProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children?: ReactNode;
};

export function CardHeader({ title, eyebrow, action, children }: CardHeaderProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-medium uppercase text-[var(--muted-soft)]">{eyebrow}</p>
        ) : null}
        <h2 className="truncate text-sm font-semibold text-[var(--foreground)]">{title}</h2>
        {children ? <div className="mt-1 text-xs text-[var(--muted)]">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "green" | "red" | "amber" | "blue";
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  const tones = {
    neutral:
      "border-[var(--tone-neutral-border)] bg-[var(--tone-neutral-bg)] text-[var(--tone-neutral-fg)]",
    green:
      "border-[var(--tone-green-border)] bg-[var(--tone-green-bg)] text-[var(--tone-green-fg)]",
    red:
      "border-[var(--tone-red-border)] bg-[var(--tone-red-bg)] text-[var(--tone-red-fg)]",
    amber:
      "border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] text-[var(--tone-amber-fg)]",
    blue:
      "border-[var(--tone-blue-border)] bg-[var(--tone-blue-bg)] text-[var(--tone-blue-fg)]",
  };

  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center rounded-md border px-2 text-xs font-medium",
        tones[tone],
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

type ProgressBarProps = {
  value: number;
  label?: string;
  tone?: "green" | "amber" | "red" | "blue";
};

export function ProgressBar({ value, label, tone = "green" }: ProgressBarProps) {
  const numericValue = Number.isFinite(value) ? value : 0;
  const fillValue = Math.max(0, Math.min(100, numericValue));
  const displayValue = Math.max(0, numericValue);
  const displayPercent = formatProgressPercent(displayValue);
  const tones = {
    green: "bg-[var(--tone-green-fill)]",
    amber: "bg-[var(--tone-amber-fill)]",
    red: "bg-[var(--tone-red-fill)]",
    blue: "bg-[var(--tone-blue-fill)]",
  };

  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <span className="truncate">{label}</span>
          <span className="font-medium text-[var(--foreground-soft)]">
            {displayPercent}
          </span>
        </div>
      ) : null}
      <div
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={fillValue}
        aria-valuetext={displayPercent}
        className="h-2 overflow-hidden rounded-full bg-[var(--paper-muted)]"
        role="progressbar"
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", tones[tone])}
          style={{ width: `${fillValue}%` }}
        />
      </div>
    </div>
  );
}

function formatProgressPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Field({ label, className, ...props }: FieldProps) {
  return (
    <label className={cn("grid gap-1.5 text-xs font-medium", labelText)}>
      <span>{label}</span>
      <input
        className={cn(
          "h-9 rounded-lg border px-3 text-sm transition",
          controlSurface,
          controlFocusVisibleRing,
          className,
        )}
        {...props}
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className={cn("grid gap-1.5 text-xs font-medium", labelText)}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 rounded-lg border px-3 text-sm transition",
          controlSurface,
          controlFocusVisibleRing,
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function TextAreaField({ label, value, onChange }: TextAreaFieldProps) {
  return (
    <label className={cn("grid gap-1.5 text-xs font-medium", labelText)}>
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className={cn(
          "resize-none rounded-lg border px-3 py-2 text-sm transition",
          controlSurface,
          controlFocusVisibleRing,
        )}
      />
    </label>
  );
}

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="grid min-h-44 place-items-center px-6 py-10 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)]">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground-soft)]">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
