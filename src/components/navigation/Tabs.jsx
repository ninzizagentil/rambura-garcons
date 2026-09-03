import { cn } from '../../utils/cn';

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-[var(--color-border-gray)] overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
            active === tab.value
              ? 'border-[#0F6CFF] text-[var(--color-heading)]'
              : 'border-transparent text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
