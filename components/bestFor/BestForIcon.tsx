import { DESCRIPTION_ICONS } from "@/lib/descriptionIcons";

/** The icon a Best For card falls back on when it names none, or one that no longer exists. */
export const DEFAULT_BEST_FOR_ICON = "sparkles";

const ICON_BY_NAME = new Map(DESCRIPTION_ICONS.map((icon) => [icon.name, icon]));

interface BestForIconProps {
  /** One of the storefront's icon names ("droplets", "watch"). */
  name?: string | null;
  className?: string;
  strokeWidth?: number;
}

/**
 * One of the storefront's icons by name, drawn as an outline in the current
 * text color and sized by `className`.
 */
const BestForIcon = ({ name, className, strokeWidth = 2 }: BestForIconProps) => {
  const icon =
    ICON_BY_NAME.get(name || DEFAULT_BEST_FOR_ICON) ??
    ICON_BY_NAME.get(DEFAULT_BEST_FOR_ICON);
  if (!icon) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      // The shapes come from this project's own icon list.
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
};

export default BestForIcon;
