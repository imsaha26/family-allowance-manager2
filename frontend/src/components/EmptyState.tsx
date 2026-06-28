import React from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="glass-card p-12 text-center border border-border/50 max-w-xl mx-auto flex flex-col items-center">
      <span className="text-4xl select-none" role="img" aria-label={title}>
        {icon}
      </span>
      <h3 className="text-base font-semibold mt-4 text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-sm">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
