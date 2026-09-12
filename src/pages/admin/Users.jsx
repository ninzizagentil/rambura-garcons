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
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/roles';
import { getUsers, setUserStatus } from '../../services/userService';
import UserFormModal from './UserFormModal';

export default function Users() {
  const { showToast } = useToast();
  const { t } = useApp();
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
    showToast(t(newStatus === 'active' ? 'userReactivated' : 'userDeactivated', { name: target.fullName }), 'success');
    refresh();
  };

  const columns = [
    { key: 'fullName', header: t('name') },
    { key: 'username', header: t('usernameEmail'), render: (u) => (
        <div>
          <p className="font-medium">{u.username}</p>
          <p className="text-xs text-[var(--color-mid-gray)]">{u.email}</p>
        </div>
      ) },
    { key: 'role', header: t('role'), render: (u) => ROLE_LABELS[u.role] },
    { key: 'status', header: t('status'), render: (u) => <StatusBadge status={u.status} /> },
    { key: 'lastActivity', header: t('lastActivity'), render: (u) => new Date(u.lastActivity).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) },
    {
      key: 'actions',
      header: t('actions'),
      render: (u) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`${t('view')} ${u.fullName}`} onClick={() => { setEditingUser(u); setFormOpen(true); }} />
          <IconButton icon={Pencil} label={`${t('edit')} ${u.fullName}`} onClick={() => { setEditingUser(u); setFormOpen(true); }} />
          <IconButton
            icon={u.status === 'active' ? UserX : UserCheck}
            label={`${t(u.status === 'active' ? 'deactivate' : 'activate')} ${u.fullName}`}
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
        title={t('usersRoles')}
        description={t('manageStaffAccounts')}
        breadcrumb={[{ label: t('admin'), to: '/admin' }, { label: t('users') }]}
        actions={
          <Button icon={UserPlus} onClick={() => { setEditingUser(null); setFormOpen(true); }}>
            {t('addUser')}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder={t('searchUsers')} className="flex-1 min-w-[220px]" />
        <FilterDropdown
          label={t('allRoles')}
          value={roleFilter}
          onChange={setRoleFilter}
          options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <FilterDropdown
          label={t('allStatus')}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }]}
        />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={
            <EmptyState
              title={t('noUsersFound')}
              message={t('adjustUsersSearch')}
              actionLabel={t('addUser')}
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
        title={t(confirmTarget?.status === 'active' ? 'deactivateUser' : 'activateUser')}
        message={t(confirmTarget?.status === 'active' ? 'confirmDeactivateUser' : 'confirmActivateUser', { name: confirmTarget?.fullName || '' })}
        confirmLabel={t(confirmTarget?.status === 'active' ? 'deactivate' : 'activate')}
        variant={confirmTarget?.status === 'active' ? 'danger' : 'primary'}
      />
    </div>
  );
}
