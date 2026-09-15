import { useEffect, useMemo, useState } from 'react';
import { Download, Mail, Phone, GraduationCap, MessageSquare, X } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable, { TablePagination } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import Modal from '../../components/modals/Modal';
import StatCard from '../../components/cards/StatCard';
import { EmptyState } from '../../components/feedback/States';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApplications, updateApplicationStatus } from '../../services/applicationService';
import { exportToCSV } from '../../utils/export';
import { useApp } from '../../context/AppContext';

const STATUS_OPTIONS = ['new', 'reviewed', 'accepted', 'declined'];

export default function ManagementApplications() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useApp();

  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try { setApplications(await getApplications()); } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    if (!search) return applications;
    const q = search.toLowerCase();
    return applications.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.programLabel.toLowerCase().includes(q)
    );
  }, [applications, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(
    () => ({
      total: applications.length,
      new: applications.filter((a) => a.status === 'new').length,
      accepted: applications.filter((a) => a.status === 'accepted').length,
    }),
    [applications]
  );

  const handleStatusChange = async (app, status) => {
    const result = await updateApplicationStatus(app.id, status, user);
    if (!result.success) {
      showToast(result.error, 'error');
      return;
    }
    await refresh();
    setSelected((s) => (s && s.id === app.id ? { ...s, status } : s));
    showToast(t('applicationStatusUpdated', { name: app.fullName, status: t(`applicationStatus.${status}`) }), 'success');
  };

  const handleExport = () => {
    exportToCSV(
      'admissions-applications',
      [
        { key: 'referenceNumber', header: t('reference') }, { key: 'fullName', header: t('fullName') },
        { key: 'email', header: t('email') }, { key: 'phone', header: t('phone') }, { key: 'programLabel', header: t('program') },
        { key: 'status', header: t('status') }, { key: 'submittedAt', header: t('submitted') },
      ],
      applications
    );
    showToast(t('applicationsExported'), 'success');
  };

  const columns = [
    { key: 'referenceNumber', header: t('reference'), render: (a) => a.referenceNumber || a.id || '—' },
    { key: 'fullName', header: t('applicant') }, { key: 'programLabel', header: t('program') },
    { key: 'email', header: t('email') }, { key: 'phone', header: t('phone') },
    {
      key: 'submittedAt',
      header: t('submitted'),
      render: (a) => new Date(a.submittedAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    { key: 'status', header: t('status'), render: (a) => <StatusBadge status={a.status} label={t(`applicationStatus.${a.status}`)} /> },
  ];

  return (
    <div>
      <PageHeader
        title={t('applications')}
        description={t('applicationsDescription')}
        breadcrumb={[{ label: t('schoolManagement'), to: '/management' }, { label: t('applications') }]}
        actions={
          <Button variant="secondary" icon={Download} onClick={handleExport} disabled={applications.length === 0}>
            {t('export')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label={t('totalApplications')} value={stats.total} icon={GraduationCap} />
        <StatCard label={t('new')} value={stats.new} icon={Mail} tone="amber" />
        <StatCard label={t('accepted')} value={stats.accepted} icon={GraduationCap} tone="green" />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-gray)]">
          <SearchBar value={search} onChange={setSearch} placeholder={t('searchApplications')} />
        </div>
        {loading ? <p className="p-8 text-sm text-[var(--color-mid-gray)]">{t('loadingApplications')}</p> : applications.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={t('noApplicationsYet')}
            message={t('applicationsEmptyMessage')}
          />
        ) : (
          <>
            <DataTable columns={columns} data={paged} onRowClick={(a) => setSelected(a)} />
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.fullName} size="md">
        {selected && (
          <div>
            <div className="flex items-center justify-between mb-4">
                <StatusBadge status={selected.status} label={t(`applicationStatus.${selected.status}`)} />
              <span className="text-xs font-semibold tracking-wide text-[var(--color-medium-green)]">
                {selected.referenceNumber || selected.id || 'No reference'}
              </span>
              <span className="text-xs text-[var(--color-mid-gray)]">
                {t('appliedOn')}{' '}
                {new Date(selected.submittedAt).toLocaleString(language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2 text-[var(--color-dark-gray)]">
                <GraduationCap className="w-4 h-4 text-[var(--color-medium-green)] shrink-0" aria-hidden="true" />
                {selected.programLabel}
              </p>
              <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-[var(--color-dark-gray)] hover:underline">
                <Mail className="w-4 h-4 text-[var(--color-medium-green)] shrink-0" aria-hidden="true" />
                {selected.email}
              </a>
              <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-[var(--color-dark-gray)] hover:underline">
                <Phone className="w-4 h-4 text-[var(--color-medium-green)] shrink-0" aria-hidden="true" />
                {selected.phone}
              </a>
              <div className="grid sm:grid-cols-2 gap-3 rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-off-white)] p-4">
                {[
                  ['Date of birth', selected.dateOfBirth],
                  ['Gender', selected.gender],
                  ['Education', selected.educationLevel],
                  ['District', selected.district],
                  ['Previous school', selected.previousSchool],
                  ['Guardian', selected.guardianName],
                  ['Guardian phone', selected.guardianPhone],
                  ['Relationship', selected.guardianRelationship],
                  ['Intake year', selected.intakeYear],
                  ['Emergency contact', selected.emergencyContactName],
                  ['Emergency phone', selected.emergencyContactPhone],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-mid-gray)]">{label}</p>
                    <p className="mt-0.5 text-[var(--color-dark-gray)]">{value}</p>
                  </div>
                ))}
              </div>
              {(selected.applicantPhoto || selected.supportingDocument) && (
                <div className="flex flex-wrap gap-3">
                  {selected.applicantPhoto && <a href={selected.applicantPhoto} download={`${selected.fullName}-photo`} className="text-sm font-semibold text-[var(--color-medium-green)] hover:underline">Download applicant photo</a>}
                  {selected.supportingDocument && <a href={selected.supportingDocument} download={`${selected.fullName}-document`} className="text-sm font-semibold text-[var(--color-medium-green)] hover:underline">Download supporting document</a>}
                </div>
              )}
              {selected.message && (
                <p className="flex items-start gap-2 text-[var(--color-dark-gray)]">
                  <MessageSquare className="w-4 h-4 text-[var(--color-medium-green)] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{selected.message}</span>
                </p>
              )}
            </div>

            {hasPermission('applications.update') && <div className="mt-6">
              <p className="text-xs font-semibold text-[var(--color-mid-gray)] uppercase tracking-wide mb-2">{t('updateStatus')}</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(selected, status)}
                    disabled={selected.status === status}
                    className="disabled:opacity-100 disabled:cursor-default"
                  >
                    <StatusBadge
                      status={status}
                      label={t(`applicationStatus.${status}`)}
                      className={
                        selected.status === status
                          ? 'ring-2 ring-offset-1 ring-[var(--color-medium-green)]'
                          : 'opacity-60 hover:opacity-100 transition-opacity cursor-pointer'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>}

            <div className="flex justify-end mt-6">
              <Button variant="ghost" onClick={() => setSelected(null)} icon={X}>{t('close')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
