// The background gradients a Best For entry's card can have — the same
// twelve the storefront's homepage "shop by need" cards are drawn with, each
// running top-left → bottom-right. The backend keeps its own copy in
// utils/bestForColors.ts (it picks from them for entries made without one) —
// keep the two the same.
export type BestForColors = [from: string, to: string];

export const BEST_FOR_COLOR_PAIRS: BestForColors[] = [
  ["#ff7aa2", "#d10043"],
  ["#ff0052", "#7a0030"],
  ["#f59e7a", "#b4375a"],
  ["#9d4edd", "#3c096c"],
  ["#5ec4c0", "#1f6f78"],
  ["#6b7280", "#1d1d1b"],
  ["#ff4d86", "#1d1d1b"],
  ["#e0b354", "#8a5a00"],
  ["#b08968", "#5e3a1e"],
  ["#64748b", "#1e293b"],
  ["#f9a8d4", "#db2777"],
  ["#ff7aa2", "#ff0052"],
];

/** One of the gradients, picked at random — what a new entry starts with. */
export const randomBestForColors = (): BestForColors =>
  BEST_FOR_COLOR_PAIRS[Math.floor(Math.random() * BEST_FOR_COLOR_PAIRS.length)];

/** The CSS for a card's background: the gradient, top-left → bottom-right. */
export const bestForGradient = (colors?: string[] | null): string => {
  const [from, to] =
    colors && colors.length === 2 ? colors : BEST_FOR_COLOR_PAIRS[0];
  return `linear-gradient(to bottom right, ${from}, ${to})`;
};

export const sameBestForColors = (
  a?: string[] | null,
  b?: string[] | null,
): boolean =>
  !!a &&
  !!b &&
  a.length === 2 &&
  b.length === 2 &&
  a[0].toLowerCase() === b[0].toLowerCase() &&
  a[1].toLowerCase() === b[1].toLowerCase();
