import React from "react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Connection Error",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20 text-left max-w-xl mx-auto flex flex-col sm:flex-row items-start gap-4">
      <span className="text-xl mt-0.5 select-none" role="img" aria-label="Error">
        ⚠️
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-red-400 tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-red-400/80 mt-1 leading-relaxed break-words font-mono">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-bold transition-all border border-red-500/20"
          >
            Retry Action
          </button>
        )}
      </div>
    </div>
  );
}
