import { useState, useMemo, useEffect } from 'react';
import { UserPlus, Eye, Pencil, UserX, UserCheck } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import IconButton from '../../components/common/IconButton';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import { ROLE_LABELS } from '../../data/roles';
import { getUsers, setUserStatus } from '../../services/userService';
import UserFormModal from './UserFormModal';

export default function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const refresh = async () => { setUsers(await getUsers({ limit: 200 })); };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    const newStatus = confirmTarget.status === 'active' ? 'inactive' : 'active';
    const target = confirmTarget;
    setConfirmTarget(null);
    const result = await setUserStatus(target.id, newStatus);
    if (!result.success) { showToast(result.error, 'error'); return; }
    showToast(`${target.fullName} was ${newStatus === 'active' ? 'reactivated' : 'deactivated'}.`, 'success');
    refresh();
  };

  const columns = [
    { key: 'fullName', header: 'Name' },
    { key: 'username', header: 'Username / Email', render: (u) => (
        <div>
          <p className="font-medium">{u.username}</p>
          <p className="text-xs text-[var(--color-mid-gray)]">{u.email}</p>
        </div>
      ) },
    { key: 'role', header: 'Role', render: (u) => ROLE_LABELS[u.role] },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    { key: 'lastActivity', header: 'Last Activity', render: (u) => new Date(u.lastActivity).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`View ${u.fullName}`} onClick={() => { setEditingUser(u); setFormOpen(true); }} />
          <IconButton icon={Pencil} label={`Edit ${u.fullName}`} onClick={() => { setEditingUser(u); setFormOpen(true); }} />
          <IconButton
            icon={u.status === 'active' ? UserX : UserCheck}
            label={u.status === 'active' ? `Deactivate ${u.fullName}` : `Activate ${u.fullName}`}
            variant={u.status === 'active' ? 'danger' : 'ghost'}
            onClick={() => setConfirmTarget(u)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        description="Manage staff accounts and role assignments."
        breadcrumb={[{ label: 'Admin', to: '/admin' }, { label: 'Users' }]}
        actions={
          <Button icon={UserPlus} onClick={() => { setEditingUser(null); setFormOpen(true); }}>
            Add User
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users…" className="flex-1 min-w-[220px]" />
        <FilterDropdown
          label="All Roles"
          value={roleFilter}
          onChange={setRoleFilter}
          options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <FilterDropdown
          label="All Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
        />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={
            <EmptyState
              title="No users found"
              message="Try adjusting your search or filters, or add a new user."
              actionLabel="Add User"
              onAction={() => { setEditingUser(null); setFormOpen(true); }}
            />
          }
        />
      </div>

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editingUser}
        onSaved={() => { refresh(); setFormOpen(false); }}
      />

      <ConfirmModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleToggleStatus}
        title={confirmTarget?.status === 'active' ? 'Deactivate user' : 'Activate user'}
        message={`Are you sure you want to ${confirmTarget?.status === 'active' ? 'deactivate' : 'activate'} ${confirmTarget?.fullName}?`}
        confirmLabel={confirmTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
        variant={confirmTarget?.status === 'active' ? 'danger' : 'primary'}
      />
    </div>
  );
}
