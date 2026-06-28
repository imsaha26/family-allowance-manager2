import React from "react";

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3 animate-pulse border border-border/40">
      <div className="h-3 w-1/3 bg-muted/65 rounded" />
      <div className="h-6 w-1/2 bg-muted rounded" />
      <div className="h-3 w-2/3 bg-muted/40 rounded" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4 animate-pulse border border-border/40">
      <div className="space-y-2">
        <div className="h-4 w-1/4 bg-muted rounded" />
        <div className="h-3 w-1/3 bg-muted/50 rounded" />
      </div>
      <div className="h-48 w-full bg-muted/20 rounded-xl border border-dashed border-border/30 flex items-center justify-center">
        <div className="h-2 w-1/4 bg-muted/40 rounded" />
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-4 flex items-center justify-between gap-4 animate-pulse border border-border/40">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-1/3 bg-muted rounded" />
              <div className="h-2.5 w-1/2 bg-muted/50 rounded" />
            </div>
          </div>
          <div className="h-4 w-12 bg-muted rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function MemberRowSkeleton() {
  return (
    <div className="py-4 flex items-center justify-between gap-4 animate-pulse">
      <div className="space-y-2 flex-1 min-w-0">
        <div className="h-4 w-1/4 bg-muted rounded" />
        <div className="h-3 w-1/3 bg-muted/50 rounded" />
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="h-8 w-20 bg-muted rounded-lg" />
        <div className="h-8 w-16 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
