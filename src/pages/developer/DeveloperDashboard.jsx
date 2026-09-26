import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Archive, Database, ShieldCheck, Users } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { Badge } from '../../components/common/Badge';
import { getDeveloperOverview } from '../../services/developerService';

const cards = [
  { key: 'system', label: 'System Status', icon: ShieldCheck },
  { key: 'database', label: 'Database Status', icon: Database },
  { key: 'authentication', label: 'Authentication Status', icon: Users },
  { key: 'notifications', label: 'Notification Status', icon: Activity },
  { key: 'backups', label: 'Backup Status', icon: Archive },
];

export default function DeveloperDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDeveloperOverview().then((data) => {
      if (active) setOverview(data);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-6 text-sm text-[var(--color-mid-gray)]">Loading developer overview…</div>;
  }

  return (
    <div>
      <PageHeader title="Developer Panel" description="Operational overview of access, health, backup, and recovery services." breadcrumb={[{ label: 'Developer Panel' }]} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ key, label, icon: Icon }) => {
          const value = overview?.[key];
          const tone = value?.status === 'healthy' ? 'green' : value?.status === 'warning' ? 'amber' : 'red';
          return (
            <div key={key} className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{label}</span>
                <Icon className="h-4 w-4 text-[var(--color-mid-gray)]" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Badge tone={tone}>{value?.label || 'Not available'}</Badge>
              </div>
              <p className="mt-3 text-sm text-[var(--color-mid-gray)]">{value?.detail || 'Not available'}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <h3 className="text-lg font-semibold text-[var(--color-dark-gray)]">Recent activity</h3>
          <div className="mt-4 space-y-3">
            {(overview?.recentActivity || []).slice(0, 5).map((item, index) => (
              <div key={`${item.action}-${index}`} className="flex items-start justify-between gap-3 border-b border-[var(--color-border-gray)] pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-[var(--color-dark-gray)]">{item.action}</p>
                  <p className="text-sm text-[var(--color-mid-gray)]">{item.module}</p>
                </div>
                <span className="text-xs text-[var(--color-mid-gray)]">{new Date(item.time).toLocaleString()}</span>
              </div>
            )) || <p className="text-sm text-[var(--color-mid-gray)]">No recent activity.</p> }
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <h3 className="text-lg font-semibold text-[var(--color-dark-gray)]">Recent errors</h3>
          <div className="mt-4 space-y-3">
            {(overview?.recentErrors || []).length ? overview.recentErrors.slice(0, 5).map((item, index) => (
              <div key={`${item.action}-${index}`} className="flex items-start gap-3 rounded-lg bg-[var(--color-off-white)] p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--color-status-red)]" />
                <div>
                  <p className="font-medium text-[var(--color-dark-gray)]">{item.action}</p>
                  <p className="text-sm text-[var(--color-mid-gray)]">{item.message}</p>
                </div>
              </div>
            )) : <p className="text-sm text-[var(--color-mid-gray)]">No recent errors reported.</p> }
          </div>
        </div>
      </div>
    </div>
  );
}
