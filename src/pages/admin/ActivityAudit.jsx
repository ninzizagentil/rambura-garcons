import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, User, CheckCircle2, AlertCircle, AlertTriangle, Info, Activity as ActivityIcon, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable, { TablePagination } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/feedback/States';
import { getActivity, refreshActivity, useActivityVersion } from '../../services/activityService';
import { getActivityStatus, timeAgo } from '../../utils/activityStatus';
import { useApp } from '../../context/AppContext';

const STATUS_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const MODULE_ICONS = {
  Website: '🌐',
  Library: '📚',
  Stock: '📦',
  Users: '👥',
  Settings: '⚙️',
  Admissions: '📝',
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function ActivityAudit() {
  const { t } = useApp();
  const activityVersion = useActivityVersion();
  const activity = useMemo(() => { void activityVersion; return getActivity(); }, [activityVersion]);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    refreshActivity({ fromDate, toDate }).catch(() => {});
  }, [fromDate, toDate]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const paginated = useMemo(() => filtered.slice(pageStart, pageStart + pageSize), [filtered, pageStart, pageSize]);

  const updateFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshActivity({ fromDate, toDate }).catch(() => {});
    setRefreshing(false);
  };

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
      header: t('user'),
      render: (a) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--color-mid-gray)]" />
          <span className="font-medium text-[var(--color-dark-gray)]">{a.user}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: t('action'),
      render: (a) => <span className="text-[var(--color-dark-gray)]">{a.action}</span>,
    },
    {
      key: 'module',
      header: t('module'),
      render: (a) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{MODULE_ICONS[a.module] || '📌'}</span>
          <span className="font-medium text-[var(--color-dark-gray)]">{a.module}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: t('timestamp'),
      render: (a) => (
        <div className="flex items-center gap-2" title={new Date(a.date).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}>
          <Calendar className="w-4 h-4 text-[var(--color-mid-gray)]" />
          <div className="leading-tight">
            <div className="text-sm text-[var(--color-dark-gray)] font-medium">{timeAgo(a.date)}</div>
            <div className="text-xs text-[var(--color-mid-gray)]">
              {new Date(a.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (a) => {
        const status = getActivityStatus(a.status);
        const StatusIcon = STATUS_ICONS[a.status] || Info;
        return (
          <div className="flex items-center gap-2">
            <StatusIcon
              className={
                status.tone === 'green' ? 'w-4 h-4 text-[var(--color-status-green)]' :
                status.tone === 'red' ? 'w-4 h-4 text-[var(--color-status-red)]' :
                status.tone === 'amber' ? 'w-4 h-4 text-[var(--color-status-amber)]' :
                status.tone === 'blue' ? 'w-4 h-4 text-[var(--color-status-blue)]' :
                'w-4 h-4 text-[var(--color-mid-gray)]'
              }
            />
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('activityAuditLog')}
        description={t('activityAuditDescription')}
        breadcrumb={[{ label: t('admin'), to: '/admin' }, { label: t('activityAudit') }]}
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--color-border-gray)] bg-[var(--color-white)] text-sm font-semibold text-[var(--color-dark-gray)] hover:bg-[var(--color-off-white)] disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshing ? t('refreshing') : t('refresh')}
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-[0_12px_30px_rgba(15,108,255,0.08)] transition-all duration-300 hover:shadow-[0_18px_42px_rgba(15,108,255,0.12)] hover:-translate-y-1 ring-1 ring-[rgba(15,108,255,0.04)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(217,164,65,0.02)] via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[linear-gradient(135deg,rgba(15,108,255,0.12),rgba(15,108,255,0.06))] text-[var(--color-medium-green)] ring-1 ring-[rgba(15,108,255,0.1)]">
                <ActivityIcon className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <span className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-widest">{t('totalEvents')}</span>
            <div className="text-3xl font-bold text-[var(--color-dark-gray)] mt-1.5">{stats.total}</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-[0_12px_30px_rgba(15,108,255,0.08)] transition-all duration-300 hover:shadow-[0_18px_42px_rgba(15,108,255,0.12)] hover:-translate-y-1 ring-1 ring-[rgba(15,108,255,0.04)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(15,200,100,0.02)] via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-status-green-bg)] text-[var(--color-status-green)] ring-1 ring-[rgba(15,200,100,0.2)]">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <span className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-widest">{t('successful')}</span>
            <div className="text-3xl font-bold text-[var(--color-status-green)] mt-1.5">{stats.success}</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-[0_12px_30px_rgba(15,108,255,0.08)] transition-all duration-300 hover:shadow-[0_18px_42px_rgba(15,108,255,0.12)] hover:-translate-y-1 ring-1 ring-[rgba(15,108,255,0.04)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(217,119,6,0.02)] via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-status-amber-bg)] text-[var(--color-status-amber)] ring-1 ring-[rgba(217,119,6,0.2)]">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <span className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-widest">{t('warnings')}</span>
            <div className="text-3xl font-bold text-[var(--color-status-amber)] mt-1.5">{stats.warnings}</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-[0_12px_30px_rgba(15,108,255,0.08)] transition-all duration-300 hover:shadow-[0_18px_42px_rgba(15,108,255,0.12)] hover:-translate-y-1 ring-1 ring-[rgba(15,108,255,0.04)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(220,38,38,0.02)] via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-status-red-bg)] text-[var(--color-status-red)] ring-1 ring-[rgba(220,38,38,0.2)]">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <span className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-widest">{t('errors')}</span>
            <div className="text-3xl font-bold text-[var(--color-status-red)] mt-1.5">{stats.errors}</div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-6 mb-6 shadow-[0_12px_30px_rgba(15,108,255,0.06)] ring-1 ring-[rgba(15,108,255,0.04)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(217,164,65,0.02)] via-transparent to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--color-border-gray)]">
            <Filter className="w-5 h-5 text-[var(--color-medium-green)]" />
            <h3 className="font-semibold text-[var(--color-dark-gray)]">{t('filtersSearch')}</h3>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-mid-gray)]" />
            <input
              type="text"
              placeholder={t('searchUserAction')}
              value={search}
              onChange={(e) => updateFilter(setSearch)(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[var(--color-border-gray)] text-sm text-[var(--color-dark-gray)] placeholder-[var(--color-mid-gray)] focus:outline-none focus:border-[var(--color-medium-green)] focus:ring-1 focus:ring-[var(--color-medium-green)]"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => updateFilter(setModuleFilter)(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-gray)] text-sm text-[var(--color-dark-gray)] bg-[var(--color-white)] focus:outline-none focus:border-[var(--color-medium-green)] focus:ring-1 focus:ring-[var(--color-medium-green)] appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23555' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">{t('allModules')}</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {MODULE_ICONS[m]} {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => updateFilter(setStatusFilter)(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-gray)] text-sm text-[var(--color-dark-gray)] bg-[var(--color-white)] focus:outline-none focus:border-[var(--color-medium-green)] focus:ring-1 focus:ring-[var(--color-medium-green)] appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23555' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">{t('allStatuses')}</option>
              {statuses.map((s) => {
                const status = getActivityStatus(s);
                return (
                  <option key={s} value={s}>
                    {status.label}
                  </option>
                );
              })}
            </select>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-dark-gray)]">
            {t('fromDate')}
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => updateFilter(setFromDate)(e.target.value)}
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-gray)] bg-[var(--color-white)] px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-dark-gray)]">
            {t('toDate')}
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => updateFilter(setToDate)(e.target.value)}
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-gray)] bg-[var(--color-white)] px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)]"
            />
          </label>

          {(search || moduleFilter || statusFilter || fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setModuleFilter('');
                setStatusFilter('');
                setFromDate('');
                setToDate('');
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-lg bg-[var(--color-off-white)] text-sm font-medium text-[var(--color-dark-gray)] hover:bg-[var(--color-soft-gray)] transition-colors"
            >
              {t('clearAllFilters')}
            </button>
          )}
        </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] shadow-[0_12px_30px_rgba(15,108,255,0.06)] ring-1 ring-[rgba(15,108,255,0.04)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(217,164,65,0.01)] via-transparent to-transparent" />
        <div className="relative">
          <div className="px-6 py-4 border-b border-[var(--color-border-gray)] flex items-center justify-between bg-gradient-to-r from-[rgba(217,164,65,0.02)] to-transparent">
            <div className="flex items-center gap-2 text-sm text-[var(--color-mid-gray)]">
              <ActivityIcon className="w-4 h-4 text-[var(--color-medium-green)]" />
              <span>
                {t('showingEvents', { shown: filtered.length, total: activity.length })}
              </span>
            </div>
          </div>
          <DataTable columns={columns} data={paginated} emptyState={<EmptyState title={t('noActivityFound')} message={t('adjustActivityFilters')} />} />
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}
