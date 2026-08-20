import { useState } from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { ROLE_LABELS } from '../../data/roles';

const MODULES = ['Library MIS', 'Stock MIS', 'Website Management', 'User Management', 'Reports'];

const DEFAULT_MATRIX = {
  admin: MODULES.reduce((acc, m) => ({ ...acc, [m]: true }), {}),
  librarian: { 'Library MIS': true, 'Stock MIS': false, 'Website Management': false, 'User Management': false, Reports: true },
  stock_manager: { 'Library MIS': false, 'Stock MIS': true, 'Website Management': false, 'User Management': false, Reports: true },
  management: { 'Library MIS': false, 'Stock MIS': false, 'Website Management': false, 'User Management': false, Reports: true },
};

export default function RolesPermissions() {
  const { showToast } = useToast();
  const [activeRole, setActiveRole] = useState('librarian');
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);

  const toggle = (module) => {
    if (activeRole === 'admin') return; // Admin always retains full access
    setMatrix((m) => ({ ...m, [activeRole]: { ...m[activeRole], [module]: !m[activeRole][module] } }));
  };

  const handleSave = () => showToast('Permissions saved successfully.', 'success');

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Control which modules each role can access."
        breadcrumb={[{ label: 'Admin', to: '/admin' }, { label: 'Roles & Permissions' }]}
      />

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-2">
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveRole(value)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                activeRole === value ? 'bg-[var(--color-light-green-100)] text-[var(--color-deep-green)]' : 'text-[var(--color-mid-gray)] hover:bg-[var(--color-off-white)]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--color-dark-gray)] mb-1">
            {ROLE_LABELS[activeRole]} Permissions
          </h2>
          <p className="text-sm text-[var(--color-mid-gray)] mb-5">
            {activeRole === 'admin' ? 'Administrators always have full system access.' : 'Toggle module access for this role.'}
          </p>
          <div className="divide-y divide-[var(--color-border-gray)]">
            {MODULES.map((module) => (
              <div key={module} className="flex items-center justify-between py-3.5">
                <span className="text-sm text-[var(--color-dark-gray)]">{module}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={matrix[activeRole][module]}
                  onClick={() => toggle(module)}
                  disabled={activeRole === 'admin'}
                  className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${
                    matrix[activeRole][module] ? 'bg-[var(--color-medium-green)]' : 'bg-[var(--color-soft-gray)]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center transition-transform ${
                      matrix[activeRole][module] ? 'translate-x-5' : ''
                    }`}
                  >
                    {matrix[activeRole][module] && <Check className="w-3 h-3 text-[var(--color-medium-green)]" />}
                  </span>
                </button>
              </div>
            ))}
          </div>
          <Button variant="primary" className="mt-6" onClick={handleSave} disabled={activeRole === 'admin'}>
            Save Permissions
          </Button>
        </div>
      </div>
    </div>
  );
}
