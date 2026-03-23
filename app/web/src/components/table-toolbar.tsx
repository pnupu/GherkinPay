"use client";

import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

// ---------------------------------------------------------------------------
// Filter Pill
// ---------------------------------------------------------------------------

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterPills({ options, value, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            {opt.label}
            {opt.count !== undefined && opt.count > 0 && (
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  isActive
                    ? "text-primary/70"
                    : "text-muted-foreground/60",
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search Input
// ---------------------------------------------------------------------------

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <svg
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 pr-8 w-56 text-xs"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <svg
            className="h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table Toolbar — combines search + filters + result count
// ---------------------------------------------------------------------------

interface TableToolbarProps {
  /** Total items after filtering */
  totalFiltered: number;
  /** Total items before filtering */
  totalAll: number;
  /** Unit name for count display, e.g. "agreement" */
  unit: string;
  /** Search props */
  search?: SearchInputProps;
  /** Filter pill props */
  filters?: FilterPillsProps;
  /** Extra content on the right */
  children?: React.ReactNode;
}

export function TableToolbar({
  totalFiltered,
  totalAll,
  unit,
  search,
  filters,
  children,
}: TableToolbarProps) {
  const plural = totalFiltered !== 1 ? `${unit}s` : unit;
  const isFiltered = totalFiltered !== totalAll;

  return (
    <div className="flex flex-col gap-3 mb-1">
      <div className="flex flex-wrap items-center gap-3">
        {search && <SearchInput {...search} />}
        {children}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {isFiltered
            ? `${totalFiltered} of ${totalAll} ${plural}`
            : `${totalAll} ${plural}`}
        </span>
      </div>
      {filters && <FilterPills {...filters} />}
    </div>
  );
}
