import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { Badge } from '../../components/common/Badge';
import { getDeveloperRoles } from '../../services/developerService';

export default function DeveloperRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDeveloperRoles().then((data) => { if (active) setRoles(data); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-6 text-sm text-[var(--color-mid-gray)]">Loading role permissions…</div>;

  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Review how role permissions map to access decisions and module access." breadcrumb={[{ label: 'Developer Panel', to: '/developer' }, { label: 'Roles & Permissions' }]} />
      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.name} className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-dark-gray)]">{role.label || role.name}</h3>
              <Badge tone="blue">{role.name}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {(role.permissions || []).map((permission) => (
                <span key={permission._id || permission.key || permission} className="rounded-full border border-[var(--color-border-gray)] bg-[var(--color-off-white)] px-2.5 py-1 text-xs text-[var(--color-dark-gray)]">
                  {permission.key || permission}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
