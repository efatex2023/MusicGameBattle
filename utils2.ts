import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Props comparator for React.memo on components fed fresh JSON snapshots from the socket:
// re-render only when the data actually changed (functions compared by identity).
export function sameProps<T extends object>(a: T, b: T): boolean {
  for (const k in a) {
    const x = a[k];
    const y = b[k];
    if (x === y) continue;
    if (typeof x === "function" || typeof y === "function") return false;
    if (JSON.stringify(x) !== JSON.stringify(y)) return false;
  }
  return true;
}
