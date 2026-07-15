import { IconCalendar, IconX } from '@tabler/icons-react';

interface DateRangeFilterProps {
  from: string;
  till: string;
  onFromChange: (value: string) => void;
  onTillChange: (value: string) => void;
  onReset: () => void;
  error?: string | null;
}

export function DateRangeFilter({ from, till, onFromChange, onTillChange, onReset, error }: DateRangeFilterProps) {
  const hasFilter = Boolean(from || till);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <IconCalendar size={16} className="text-muted-foreground shrink-0" />
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-brand transition-colors"
          aria-label="Von"
        />
        <span className="text-xs text-muted-foreground">bis</span>
        <input
          type="date"
          value={till}
          onChange={(e) => onTillChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-brand transition-colors"
          aria-label="Bis"
        />
        {hasFilter && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <IconX size={13} />
            Zurücksetzen
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
