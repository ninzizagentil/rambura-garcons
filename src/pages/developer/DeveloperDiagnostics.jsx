import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { getDeveloperDiagnostics, getMaintenanceMode, setMaintenanceMode } from '../../services/developerService';

export default function DeveloperDiagnostics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'health';
  const [diagnostics, setDiagnostics] = useState(null);
  const [maintenance, setMaintenance] = useState(false);

  const loadData = async () => {
    const [result, enabled] = await Promise.all([getDeveloperDiagnostics(), getMaintenanceMode()]);
    setDiagnostics(result);
    setMaintenance(enabled);
  };

  useEffect(() => { loadData(); }, []);

  const toggleMaintenance = async () => {
    const next = !maintenance;
    const updated = await setMaintenanceMode(next);
    setMaintenance(updated);
    loadData();
  };

  const tabButton = (name, label) => (
    <button type="button" key={name} onClick={() => setSearchParams({ tab: name })} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === name ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-off-white)] text-[var(--color-mid-gray)]'}`}>
      {label}
    </button>
  );

  const statusBadge = (status) => <Badge tone={status === 'healthy' ? 'green' : status === 'warning' ? 'amber' : 'red'}>{status || 'Not available'}</Badge>;

  return (
    <div>
      <PageHeader title="Diagnostics" description="Monitor system health, database availability, errors and critical controls." breadcrumb={[{ label: 'Developer Panel', to: '/developer' }, { label: 'Diagnostics' }]} />
      <div className="mb-4 flex gap-2">{tabButton('health', 'System Health')}{tabButton('database', 'Database Check')}{tabButton('notifications', 'Notification Check')}{tabButton('errors', 'Error Check')}{tabButton('controls', 'System Controls')}</div>

      {tab === 'health' && diagnostics && (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(diagnostics.overview || {}).filter(([key]) => key !== 'recentErrors' && key !== 'recentActivity' && key !== 'lastBackup').map(([key, value]) => (
            <div key={key} className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{key}</p>
                {statusBadge(value?.status)}
              </div>
              <p className="text-sm text-[var(--color-mid-gray)]">{value?.detail || 'Not available'}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'database' && (
        <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Connection</p>{statusBadge(diagnostics?.overview?.database?.status)}</div>
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Database</p>{statusBadge(diagnostics?.overview?.database?.status)}</div>
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Read operation</p>{statusBadge(diagnostics?.overview?.database?.status)}</div>
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Write check</p>{statusBadge(diagnostics?.overview?.database?.status)}</div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{diagnostics?.overview?.notifications?.detail || 'Notification service is not available.'}</p>
        </div>
      )}

      {tab === 'errors' && (
        <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          {(diagnostics?.overview?.recentErrors || []).length ? diagnostics.overview.recentErrors.map((error, index) => (
            <div key={`${error.action}-${index}`} className="mb-3 rounded-lg border border-[var(--color-border-gray)] p-3">
              <p className="font-medium text-[var(--color-dark-gray)]">{error.action}</p>
              <p className="text-sm text-[var(--color-mid-gray)]">{error.message}</p>
            </div>
          )) : <p className="text-sm text-[var(--color-mid-gray)]">No recent errors found.</p>}
        </div>
      )}

      {tab === 'controls' && (
        <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <h3 className="text-lg font-semibold text-[var(--color-dark-gray)]">Maintenance mode</h3>
          <p className="mt-2 text-sm text-[var(--color-mid-gray)]">The system will become unavailable to normal users while the developer panel remains accessible.</p>
          <div className="mt-4 flex items-center gap-4">
            <Badge tone={maintenance ? 'amber' : 'green'}>{maintenance ? 'Enabled' : 'Disabled'}</Badge>
            <Button type="button" onClick={toggleMaintenance}>{maintenance ? 'Disable maintenance' : 'Enable maintenance'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
