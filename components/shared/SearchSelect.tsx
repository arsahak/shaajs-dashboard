"use client";

import { useEffect, useRef, useState } from "react";
import { BiCheck, BiSearch } from "react-icons/bi";

export interface SearchSelectOption {
  id: string;
  label: string;
  /** Nesting level (0 = top-level). Renders as an indented tree row. */
  depth?: number;
  /** Full "Parent › Child › Grandchild" breadcrumb, shown once selected
   * instead of the bare label so the lineage stays visible when collapsed. */
  fullPath?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

const SearchSelect = ({
  options,
  value,
  onChange,
  placeholder = "Search…",
  emptyText = "No results found.",
  className = "",
}: SearchSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.id === value);
  const selectedLabel = selectedOption?.fullPath || selectedOption?.label || "";

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <BiSearch
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={open ? query : selectedLabel}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          placeholder={selectedLabel || placeholder}
          className={`${inputClass} pl-8`}
        />
      </div>
      {open && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">{emptyText}</p>
          ) : (
            filtered.map((o) => {
              const depth = o.depth ?? 0;
              const selected = o.id === value;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  style={{ paddingLeft: 12 + depth * 18 }}
                  className={`flex w-full items-center gap-1.5 py-2 pr-3 text-left text-sm hover:bg-gray-50 ${
                    selected
                      ? "bg-primary/5 font-medium text-primary-dark"
                      : depth === 0
                        ? "font-semibold text-gray-900"
                        : "text-gray-600"
                  }`}
                >
                  {depth > 0 && (
                    <span className="shrink-0 text-gray-300">
                      {"·".repeat(depth - 1)}└
                    </span>
                  )}
                  <span className="truncate">{o.label}</span>
                  {selected && (
                    <BiCheck size={14} className="ml-auto shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
