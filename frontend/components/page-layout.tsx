import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("app-page", className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="app-page-header">
      <div className="min-w-0">
        <h2 className="app-page-title">{title}</h2>
        <p className="app-page-description">{description}</p>
      </div>
      {actions ? <div className="app-page-actions shrink-0">{actions}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("app-field", className)}>
      <span className="app-field-label">{label}</span>
      {children}
      {hint ? <span className="app-field-hint">{hint}</span> : null}
    </label>
  );
}
