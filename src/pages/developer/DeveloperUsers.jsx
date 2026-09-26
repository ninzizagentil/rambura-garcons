import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { getDeveloperUsers } from '../../services/developerService';
import { setUserStatus } from '../../services/userService';

export default function DeveloperUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    const next = await getDeveloperUsers();
    setUsers(next);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const result = await setUserStatus(user._id || user.id, nextStatus);
    if (result.success) loadUsers();
  };

  return (
    <div>
      <PageHeader title="Users" description="Inspect account status, role assignment and access state." breadcrumb={[{ label: 'Developer Panel', to: '/developer' }, { label: 'Users' }]} />
      {loading ? <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-6 text-sm text-[var(--color-mid-gray)]">Loading users…</div> : (
        <div className="overflow-hidden rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-off-white)] text-[var(--color-mid-gray)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last activity</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id || user.id} className="border-t border-[var(--color-border-gray)] align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-dark-gray)]">{user.fullName || user.username}</p>
                    <p className="text-xs text-[var(--color-mid-gray)]">{user.email || user.username}</p>
                  </td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3"><Badge tone={user.status === 'active' ? 'green' : 'red'}>{user.status || 'unknown'}</Badge></td>
                  <td className="px-4 py-3 text-[var(--color-mid-gray)]">{user.lastActivity ? new Date(user.lastActivity).toLocaleString() : 'Not available'}</td>
                  <td className="px-4 py-3">
                    <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleStatus(user)}>{user.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
