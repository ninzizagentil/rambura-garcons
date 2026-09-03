import { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { ROLE_LABELS } from '../../data/roles';
import { getRoles, getPermissions, updateRolePermissions } from '../../services/accessService';

const MODULE_LABELS = {
  users: 'User Management',
  website: 'Website Management',
  library: 'Library MIS',
  stock: 'Stock MIS',
  applications: 'Admissions',
  reports: 'Reports',
  audit: 'Activity & Audit',
  settings: 'Settings',
};

const PERMISSION_LABELS = {
  view: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  borrow: 'Borrow',
  return: 'Return',
  reports: 'Reports',
  adjust: 'Adjust',
  in: 'Stock In',
  out: 'Stock Out',
  transfer: 'Transfer',
  damage: 'Damage',
  dispose: 'Dispose',
  suppliers: 'Suppliers',
  settings: 'Settings',
};

export default function RolesPermissions() {
  const { showToast } = useToast();
  const [activeRole, setActiveRole] = useState('librarian');
  const [permissions, setPermissions] = useState([]);
  // roleName -> Set of permission ids currently checked for that role (pending save)
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rolesData, permissionsData] = await Promise.all([getRoles(), getPermissions()]);
        setPermissions(permissionsData);
        setSelections(Object.fromEntries(rolesData.map((role) => [role.name, new Set(role.permissions.map((p) => p._id || p))])));
      } catch {
        showToast('Could not load roles and permissions.', 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modules = useMemo(() => {
    const byModule = {};
    for (const permission of permissions) {
      if (!byModule[permission.module]) byModule[permission.module] = [];
      byModule[permission.module].push(permission);
    }
    return byModule;
  }, [permissions]);

  const activeSelection = selections[activeRole] || new Set();

  const toggleModule = (module) => {
    if (activeRole === 'admin') return; // Admin always retains full access
    const modulePermissionIds = (modules[module] || []).map((p) => p._id);
    const allSelected = modulePermissionIds.every((id) => activeSelection.has(id));
    setSelections((prev) => {
      const next = new Set(prev[activeRole]);
      modulePermissionIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return { ...prev, [activeRole]: next };
    });
  };

  const handleSave = async () => {
    if (activeRole === 'admin') return;
    setSaving(true);
    const result = await updateRolePermissions(activeRole, Array.from(activeSelection));
    setSaving(false);
    if (!result.success) { showToast(result.error || 'Could not save permissions.', 'error'); return; }
    showToast('Permissions saved successfully.', 'success');
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Roles & Permissions"
          description="Control which modules each role can access."
          breadcrumb={[{ label: 'Admin', to: '/admin' }, { label: 'Roles & Permissions' }]}
        />
        <p className="text-sm text-[var(--color-mid-gray)]">Loading permissions…</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Control which modules each role can access."
        breadcrumb={[{ label: 'Admin', to: '/admin' }, { label: 'Roles & Permissions' }]}
      />

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-3 shadow-[var(--shadow-card)]">
          <div className="mb-3 px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-mid-gray)]">Roles</p>
          </div>
          <div className="space-y-2">
            {Object.entries(ROLE_LABELS).map(([value, label]) => {
              const isActive = activeRole === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveRole(value)}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition-all ${
                    isActive
                      ? 'border-[var(--color-medium-green)] bg-[var(--color-light-green-100)] text-[var(--color-heading)] shadow-sm'
                      : 'border-transparent bg-[var(--color-off-white)] text-[var(--color-mid-gray)] hover:border-[var(--color-border-gray)] hover:text-[var(--color-heading)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? 'bg-[var(--color-medium-green)] text-white' : 'bg-[var(--surface)] text-[var(--color-mid-gray)]'}`}>
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-[11px] opacity-75">
                        {value === 'admin' ? 'Full access' : 'Custom access'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-mid-gray)]">Access Control</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--color-dark-gray)]">
                {ROLE_LABELS[activeRole]}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[var(--color-border-gray)] bg-[var(--color-off-white)] px-3 py-1.5 text-xs font-medium text-[var(--color-mid-gray)]">
                {activeRole === 'admin' ? 'Full system access' : `${activeSelection.size} permissions`}
              </span>
              <span className="inline-flex items-center rounded-full bg-[var(--color-gold-100)] px-3 py-1.5 text-xs font-medium text-[var(--color-heading)]">
                {activeRole === 'admin' ? 'Protected' : 'Editable'}
              </span>
            </div>
          </div>

          <p className="mt-5 text-sm text-[var(--color-mid-gray)]">
            {activeRole === 'admin'
              ? 'Administrators always have unrestricted access across the entire platform.'
              : 'Choose the permission groups this role should be allowed to use.'}
          </p>

          <div className="mt-6 space-y-4">
            {Object.keys(modules).length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--color-border-gray)] bg-[var(--color-off-white)] p-5 text-sm text-[var(--color-mid-gray)]">
                No permission modules found.
              </div>
            )}

            {Object.entries(modules).map(([module, modulePermissions]) => {
              const moduleIds = modulePermissions.map((p) => p._id);
              const isOn = activeRole === 'admin' || moduleIds.every((id) => activeSelection.has(id));

              return (
                <div key={module} className="rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-off-white)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--color-dark-gray)]">{MODULE_LABELS[module] || module}</h3>
                      <p className="mt-1 text-xs text-[var(--color-mid-gray)]">
                        {modulePermissions.length} permissions available
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      onClick={() => toggleModule(module)}
                      disabled={activeRole === 'admin'}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors disabled:opacity-60 ${
                        isOn ? 'bg-[var(--color-medium-green)]' : 'bg-[var(--color-border-gray)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                          isOn ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {modulePermissions.map((permission) => {
                      const checked = activeRole === 'admin' || activeSelection.has(permission._id);
                      const keyName = permission.key.split('.').pop();
                      const label = PERMISSION_LABELS[keyName] || keyName;

                      return (
                        <div
                          key={permission._id}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                            checked
                              ? 'border-[var(--color-medium-green)] bg-[var(--surface)] text-[var(--color-heading)]'
                              : 'border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)]'
                          }`}
                        >
                          <span className="text-sm font-medium">{label}</span>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${checked ? 'bg-[var(--color-medium-green)] text-white' : 'bg-[var(--color-off-white)] text-[var(--color-mid-gray)]'}`}>
                            {checked ? <Check className="w-3 h-3" /> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={activeRole === 'admin'}>
              Save Permissions
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
