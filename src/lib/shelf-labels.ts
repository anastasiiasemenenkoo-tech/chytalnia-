import type { ShelfValue } from "@/lib/validators";

export const SHELF_LABELS: Record<ShelfValue, string> = {
  WANT_TO_READ: "Want to read",
  READING: "Reading now",
  READ: "Read",
};

export const SHELF_ORDER: ShelfValue[] = ["READING", "WANT_TO_READ", "READ"];
