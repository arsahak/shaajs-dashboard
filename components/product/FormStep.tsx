import type { ReactNode } from "react";

/**
 * Wrapper for a top-to-bottom sequence of form steps: draws the vertical
 * rail that the step markers sit on.
 */
export function FormSteps({ children }: { children: ReactNode }) {
  return (
    <ol className="relative space-y-7 before:absolute before:top-3 before:bottom-3 before:left-[13px] before:w-px before:bg-gray-200">
      {children}
    </ol>
  );
}

interface FormStepProps {
  /** Small icon shown in the step's marker on the rail. */
  icon: ReactNode;
  title: string;
  /** One line under the title explaining the step. */
  hint?: ReactNode;
  /** Shown at the end of the title row (e.g. a counter or a control). */
  aside?: ReactNode;
  children: ReactNode;
}

/** One step in a `FormSteps` sequence. */
export function FormStep({ icon, title, hint, aside, children }: FormStepProps) {
  return (
    <li className="relative pl-11">
      <span className="absolute top-0 left-0 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-sm text-gray-500">
        {icon}
      </span>
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        {aside}
      </div>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      <div className="mt-3">{children}</div>
    </li>
  );
}
