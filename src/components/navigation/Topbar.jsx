import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_BY_ROLE } from '../../data/roles';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';
import ThemeToggle from './ThemeToggle';

/** Flattens the role's nav (including grouped children like Stock MIS's
 * sub-items) into one searchable list of { label, to, icon, group }. */
function useSearchableItems() {
  const { role } = useAuth();
  return useMemo(() => {
    const items = NAV_BY_ROLE[role] || [];
    const flat = [];
    for (const item of items) {
      flat.push({ label: item.label, to: item.to, icon: item.icon });
      if (item.children?.length) {
        for (const child of item.children) {
          flat.push({ label: child.label, to: child.to, icon: child.icon, group: item.label });
        }
      }
    }
    return flat;
  }, [role]);
}

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = useSearchableItems();
  const navigate = useNavigate();
  const ref = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query, items]);

  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => setActiveIndex(0), [query]);

  const goTo = (item) => {
    if (!item) return;
    navigate(item.to);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goTo(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search…"
          aria-label="Search"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="global-search-results"
          className="w-full rounded-full border border-[var(--color-border-gray)] bg-[linear-gradient(135deg,_rgba(44,103,84,0.03),_rgba(217,164,65,0.03))] text-[var(--color-dark-gray)] pl-9 pr-8 py-2.5 text-sm shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)]/30 focus:border-[var(--color-medium-green)] focus:bg-[var(--sidebar-bg)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-[var(--sidebar-bg)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card-hover py-1.5 z-30 max-h-80 overflow-y-auto"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--color-mid-gray)]">No pages match "{query}"</p>
          ) : (
            results.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => goTo(item)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                    i === activeIndex ? 'bg-[var(--color-off-white)]' : ''
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-[var(--color-mid-gray)] flex-shrink-0" aria-hidden="true" />}
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[var(--color-dark-gray)]">{item.label}</span>
                    {item.group && <span className="block truncate text-xs text-[var(--color-mid-gray)]">{item.group}</span>}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function Topbar({ breadcrumbLabel }) {
  const { toggleMobileMenu } = useApp();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border-gray)] bg-[var(--sidebar-bg)]/90 backdrop-blur-xl shadow-[0_8px_24px_rgba(14,43,39,0.06)]">
      <div className="flex h-18 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label="Open menu"
            className="rounded-xl p-2 text-[var(--color-dark-gray)] hover:bg-[var(--color-soft-gray)] md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          {breadcrumbLabel && (
            <div className="hidden items-center gap-2 rounded-full border border-[var(--color-border-gray)] bg-[var(--sidebar-bg)] px-3 py-1.5 shadow-sm sm:flex">
              <span className="h-2 w-2 rounded-full bg-[var(--color-status-green)]" aria-hidden="true" />
              <p className="truncate text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{breadcrumbLabel}</p>
            </div>
          )}
        </div>

        <div className="hidden flex-1 max-w-md md:block">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="rounded-xl p-2 text-[var(--color-dark-gray)] hover:bg-[var(--color-soft-gray)] md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>
          <div className="rounded-full border border-[var(--color-border-gray)] bg-[var(--sidebar-bg)] p-1 shadow-sm">
            <ThemeToggle />
          </div>
          <div className="rounded-full border border-[var(--color-border-gray)] bg-[var(--sidebar-bg)] p-1 shadow-sm">
            <NotificationBell />
          </div>
          <div className="rounded-full border border-[var(--color-border-gray)] bg-[var(--sidebar-bg)] p-1 shadow-sm">
            <ProfileMenu />
          </div>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="px-4 pb-3 md:hidden">
          <GlobalSearch />
        </div>
      )}
    </header>
  );
}
