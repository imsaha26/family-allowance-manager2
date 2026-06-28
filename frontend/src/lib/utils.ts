import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx + tailwind-merge.
 * Required by all shadcn/ui components.
 * Usage: className={cn("base-class", conditional && "extra", props.className)}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
