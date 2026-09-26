import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { getDeveloperUsers, troubleshootAccess } from '../../services/developerService';

const permissions = [
  { label: 'Users View', value: 'users.view' },
  { label: 'Stock View', value: 'stock.view' },
  { label: 'Stock Transfer', value: 'stock.transfer' },
  { label: 'Library View', value: 'library.view' },
  { label: 'Equipment View', value: 'equipment.view' },
  { label: 'Audit View', value: 'audit.view' },
];

export default function DeveloperAccessTroubleshooter() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [module, setModule] = useState('stock');
  const [action, setAction] = useState('view');
  const [result, setResult] = useState(null);

  useEffect(() => {
    getDeveloperUsers().then((data) => {
      setUsers(data);
      if (data[0]) setUserId(data[0]._id || data[0].id);
    }).catch(() => {});
  }, []);

  const handleCheck = async () => {
    if (!userId) return;
    const next = await troubleshootAccess({ userId, module, action });
    setResult(next);
  };

  return (
    <div>
      <PageHeader title="Access Troubleshooter" description="Diagnose why a user can or cannot access a page or action." breadcrumb={[{ label: 'Developer Panel', to: '/developer' }, { label: 'Access Troubleshooter' }]} />
      <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm font-medium text-[var(--color-dark-gray)]">
            User
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--color-border-gray)] bg-[var(--color-off-white)] px-3 py-2">
              {users.map((user) => (
                <option key={user._id || user.id} value={user._id || user.id}>{user.fullName || user.username}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--color-dark-gray)]">
            Module
            <select value={module} onChange={(e) => setModule(e.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--color-border-gray)] bg-[var(--color-off-white)] px-3 py-2">
              {['users', 'stock', 'library', 'equipment', 'management', 'settings', 'audit'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--color-dark-gray)]">
            Action
            <select value={action} onChange={(e) => setAction(e.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--color-border-gray)] bg-[var(--color-off-white)] px-3 py-2">
              {['view', 'create', 'update', 'delete', 'approve', 'transfer'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <Button type="button" onClick={handleCheck}>Check Access</Button>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">User</p><p className="mt-1 text-lg font-semibold text-[var(--color-dark-gray)]">{result.user}</p></div>
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Account</p><p className="mt-1 text-lg font-semibold text-[var(--color-dark-gray)]">{result.account}</p></div>
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Role</p><p className="mt-1 text-lg font-semibold text-[var(--color-dark-gray)]">{result.role}</p></div>
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Required permission</p><p className="mt-1 text-lg font-semibold text-[var(--color-dark-gray)]">{result.requiredPermission}</p></div>
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Role permission</p><p className="mt-1 text-lg font-semibold text-[var(--color-dark-gray)]">{result.rolePermission}</p></div>
            <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Backend authorization</p><p className="mt-1 text-lg font-semibold text-[var(--color-dark-gray)]">{result.backendAuthorization}</p></div>
          </div>
          <div className="mt-5 rounded-lg border border-[var(--color-border-gray)] bg-[var(--color-off-white)] p-4 text-lg font-semibold text-[var(--color-dark-gray)]">
            {result.result}
          </div>
        </div>
      )}
    </div>
  );
}
