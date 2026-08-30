import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, User, CheckCircle2, AlertCircle, Clock, Activity as ActivityIcon } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/feedback/States';
import { getActivity } from '../../services/activityService';

const STATUS_CONFIG = {
  success: { tone: 'green', icon: CheckCircle2, label: 'Success' },
  warning: { tone: 'amber', icon: AlertCircle, label: 'Warning' },
  error: { tone: 'red', icon: AlertCircle, label: 'Error' },
  info: { tone: 'blue', icon: Clock, label: 'Info' },
};

const MODULE_ICONS = {
  Website: '🌐',
  Library: '📚',
  Stock: '📦',
  Users: '👥',
  Settings: '⚙️',
  Admissions: '📝',
};

export default function ActivityAudit() {
  const [activity] = useState(getActivity());
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'

  const modules = useMemo(() => [...new Set(activity.map((a) => a.module))], [activity]);
  const statuses = useMemo(() => [...new Set(activity.map((a) => a.status))], [activity]);

  const filtered = useMemo(() => {
    return activity.filter((a) => {
      const matchesSearch = !search || a.action.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase());
      const matchesModule = !moduleFilter || a.module === moduleFilter;
      const matchesStatus = !statusFilter || a.status === statusFilter;
      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [activity, search, moduleFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      success: filtered.filter((a) => a.status === 'success').length,
      warnings: filtered.filter((a) => a.status === 'warning').length,
      errors: filtered.filter((a) => a.status === 'error').length,
    }),
    [filtered]
  );

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (a) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--color-mid-gray)]" />
          <span className="font-medium text-[var(--color-dark-gray)]">{a.user}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (a) => <span className="text-[var(--color-dark-gray)]">{a.action}</span>,
    },
    {
      key: 'module',
      header: 'Module',
      render: (a) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{MODULE_ICONS[a.module] || '📌'}</span>
          <span className="font-medium text-[var(--color-dark-gray)]">{a.module}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Timestamp',
      render: (a) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--color-mid-gray)]" />
          <span className="text-sm text-[var(--color-mid-gray)]">
            {new Date(a.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => {
        const config = STATUS_CONFIG[a.status] || STATUS_CONFIG.info;
        const StatusIcon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            <Badge tone={config.tone}>{config.label}</Badge>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Activity & Audit Log"
        description="Complete system-wide activity log with filtering and search capabilities."
        breadcrumb={[{ label: 'Admin', to: '/admin' }, { label: 'Activity & Audit' }]}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[var(--color-white)] rounded-lg border border-[var(--color-border-gray)] p-4">
          <div className="text-xs font-semibold text-[var(--color-mid-gray)] uppercase tracking-wide mb-1">Total Events</div>
          <div className="text-2xl font-bold text-[var(--color-dark-gray)]">{stats.total}</div>
        </div>
        <div className="bg-[var(--color-white)] rounded-lg border border-[var(--color-border-gray)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-medium-green)]" />
            <span className="text-xs font-semibold text-[var(--color-mid-gray)] uppercase tracking-wide">Successful</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-medium-green)]">{stats.success}</div>
        </div>
        <div className="bg-[var(--color-white)] rounded-lg border border-[var(--color-border-gray)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-[var(--color-mid-gray)] uppercase tracking-wide">Warnings</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.warnings}</div>
        </div>
        <div className="bg-[var(--color-white)] rounded-lg border border-[var(--color-border-gray)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-[var(--color-status-red)]" />
            <span className="text-xs font-semibold text-[var(--color-mid-gray)] uppercase tracking-wide">Errors</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-red)]">{stats.errors}</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-[var(--color-white)] rounded-lg border border-[var(--color-border-gray)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--color-border-gray)]">
          <Filter className="w-5 h-5 text-[var(--color-mid-gray)]" />
          <h3 className="font-semibold text-[var(--color-dark-gray)]">Filters & Search</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-mid-gray)]" />
            <input
              type="text"
              placeholder="Search by user or action…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[var(--color-border-gray)] text-sm text-[var(--color-dark-gray)] placeholder-[var(--color-mid-gray)] focus:outline-none focus:border-[var(--color-medium-green)] focus:ring-1 focus:ring-[var(--color-medium-green)]"
            />
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-gray)] text-sm text-[var(--color-dark-gray)] bg-[var(--color-white)] focus:outline-none focus:border-[var(--color-medium-green)] focus:ring-1 focus:ring-[var(--color-medium-green)] appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23555' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {MODULE_ICONS[m]} {m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-gray)] text-sm text-[var(--color-dark-gray)] bg-[var(--color-white)] focus:outline-none focus:border-[var(--color-medium-green)] focus:ring-1 focus:ring-[var(--color-medium-green)] appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23555' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => {
                const config = STATUS_CONFIG[s] || STATUS_CONFIG.info;
                return (
                  <option key={s} value={s}>
                    {config.label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Clear Filters */}
          {(search || moduleFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setModuleFilter('');
                setStatusFilter('');
              }}
              className="px-4 py-2.5 rounded-lg bg-[var(--color-off-white)] text-sm font-medium text-[var(--color-dark-gray)] hover:bg-[var(--color-light-gray)] transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-[var(--color-white)] rounded-lg border border-[var(--color-border-gray)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border-gray)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--color-mid-gray)]">
            <ActivityIcon className="w-4 h-4" />
            <span>
              Showing <span className="font-semibold text-[var(--color-dark-gray)]">{filtered.length}</span> of{' '}
              <span className="font-semibold text-[var(--color-dark-gray)]">{activity.length}</span> events
            </span>
          </div>
        </div>
        <DataTable columns={columns} data={filtered} emptyState={<EmptyState title="No activity found" message="Try adjusting your filters or search terms." />} />
      </div>
    </div>
  );
}
