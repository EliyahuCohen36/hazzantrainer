"use client";

export interface ReaderSettings {
  scrollMode: boolean;
  showNikkud: boolean;
  showTeamim: boolean;
  showTaamNames: boolean;
}

interface Props {
  value: ReaderSettings;
  onChange: (next: ReaderSettings) => void;
}

function Switch({
  checked,
  onChange,
  label,
  disabled,
  big,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  big?: boolean;
}) {
  return (
    <label
      className={`flex select-none items-center gap-2 ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${big ? "text-base font-semibold" : "text-sm"}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${big ? "h-7 w-12" : "h-5 w-9"} ${checked ? "bg-amber-700" : "bg-stone-300"}`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow transition-transform ${big ? "h-5 w-5" : "h-3.5 w-3.5"} ${checked ? (big ? "translate-x-6" : "translate-x-4.5") : "translate-x-1"}`}
        />
      </button>
      {label}
    </label>
  );
}

/**
 * "Torah Scroll Mode" is the main switch. When it's on, every mark is hidden
 * and the scroll typeface is used. When it's off, nikkud and te'amim can be
 * toggled separately (for example, te'amim only, to practise the tune without vowels).
 */
export function DisplayModeToggle({ value, onChange }: Props) {
  const set = (patch: Partial<ReaderSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <Switch big label="Torah Scroll Mode" checked={value.scrollMode} onChange={(v) => set({ scrollMode: v })} />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-stone-200 sm:border-s sm:ps-6">
        <Switch label="Nikkud" disabled={value.scrollMode} checked={value.showNikkud} onChange={(v) => set({ showNikkud: v })} />
        <Switch label="Te'amim" disabled={value.scrollMode} checked={value.showTeamim} onChange={(v) => set({ showTeamim: v })} />
        <Switch
          label="Ta'am names"
          disabled={value.scrollMode}
          checked={value.showTaamNames}
          onChange={(v) => set({ showTaamNames: v })}
        />
      </div>
    </div>
  );
}
