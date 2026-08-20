import { useState, useMemo } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/feedback/States';
import { getActivity } from '../../services/activityService';

const STATUS_TONE = { success: 'green', warning: 'amber', error: 'red' };

export default function ActivityAudit() {
  const [activity] = useState(getActivity());
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const modules = useMemo(() => [...new Set(activity.map((a) => a.module))], [activity]);

  const filtered = useMemo(() => {
    return activity.filter((a) => {
      const matchesSearch = !search || a.action.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase());
      const matchesModule = !moduleFilter || a.module === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [activity, search, moduleFilter]);

  const columns = [
    { key: 'user', header: 'User' },
    { key: 'action', header: 'Action' },
    { key: 'module', header: 'Module' },
    { key: 'date', header: 'Date', render: (a) => new Date(a.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
    { key: 'status', header: 'Status', render: (a) => <Badge tone={STATUS_TONE[a.status] || 'neutral'}>{a.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Activity / Audit"
        description="System-wide activity log."
        breadcrumb={[{ label: 'Admin', to: '/admin' }, { label: 'Activity / Audit' }]}
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search activity…" className="flex-1 min-w-[220px]" />
        <FilterDropdown label="All Modules" value={moduleFilter} onChange={setModuleFilter} options={modules.map((m) => ({ value: m, label: m }))} />
      </div>
      <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable columns={columns} data={filtered} emptyState={<EmptyState title="No activity found" message="Try a different search or filter." />} />
      </div>
    </div>
  );
}
