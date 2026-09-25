import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download, Mail, Phone, GraduationCap, MessageSquare, X,
  Paperclip, Trash2, CheckCircle2, Save, RotateCcw,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable, { TablePagination } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import Modal from '../../components/modals/Modal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import StatCard from '../../components/cards/StatCard';
import { EmptyState } from '../../components/feedback/States';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApplications, getApplication, updateApplicationStatus, deleteApplication } from '../../services/applicationService';
import { exportToCSV } from '../../utils/export';
import { useApp } from '../../context/AppContext';

const STATUS_OPTIONS = ['new', 'reviewed', 'accepted', 'declined'];

/** Read a file as a base64 data-URI, enforcing type and size. */
function readAttachmentFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return reject(new Error('Please choose a PDF, JPG, PNG, GIF, or WEBP file.'));
    }
    if (file.size > 2 * 1024 * 1024) {
      return reject(new Error('Attachment must be smaller than 2 MB.'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

export default function ManagementApplications() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useApp();

  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Review panel state
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [attachment, setAttachment] = useState(null);      // { name, dataUri }
  const [attachError, setAttachError] = useState('');
  const [savingReview, setSavingReview] = useState(null);  // status string being saved, or null
  const [savingFeedback, setSavingFeedback] = useState(false);
  const fileInputRef = useRef(null);

  // The list leaves out the big base64 files; load them when a row is opened.
  const openApplication = (application) => {
    setSelected(application);
    getApplication(application.id || application._id)
      .then((full) => {
        setSelected((current) => (current && String(current.id || current._id) === String(full.id) ? { ...current, ...full } : current));
        setAttachment(full.adminAttachment ? { name: full.adminAttachmentName || 'Attachment', dataUri: full.adminAttachment } : null);
      })
      .catch(() => {});
  };

  const refresh = async () => {
    setLoading(true);
    try { setApplications(await getApplications()); } finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    getApplications()
      .then((rows) => { if (!cancelled) setApplications(rows); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Populate review panel whenever a different application is opened
  useEffect(() => {
    if (selected) {
      // oxlint-disable-next-line react/set-state-in-effect
      setReviewFeedback(selected.reviewFeedback || '');
      setAttachment(
        selected.adminAttachment
          ? { name: selected.adminAttachmentName || 'Attachment', dataUri: selected.adminAttachment }
          : null
      );
      setAttachError('');
    }
  }, [selected?._id ?? selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (a.fullName || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.programLabel || '').toLowerCase().includes(q)
      );
    });
  }, [applications, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => ({
    total: applications.length,
    new: applications.filter((a) => a.status === 'new').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
  }), [applications]);

  const handleAttachFile = async (e) => {
    setAttachError('');
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUri = await readAttachmentFile(file);
      setAttachment({ name: file.name, dataUri });
    } catch (err) {
      setAttachError(err.message);
    } finally {
      // Reset input so the same file can be re-selected after removal
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStatusChange = async (app, status) => {
    setSavingReview(status);
    const extras = {
      reviewFeedback,
      ...(attachment !== undefined && {
        adminAttachment: attachment ? attachment.dataUri : null,
        adminAttachmentName: attachment ? attachment.name : null,
      }),
    };
    const result = await updateApplicationStatus(app.id, status, extras);
    setSavingReview(null);
    if (!result.success) {
      showToast(result.error, 'error');
      return;
    }
    await refresh();
    setSelected((s) =>
      s && (s.id === app.id || s._id === app.id)
        ? { ...s, status, reviewFeedback, adminAttachment: attachment?.dataUri || null, adminAttachmentName: attachment?.name || null }
        : s
    );
    showToast(
      t('applicationStatusUpdated', { name: app.fullName, status: t(`applicationStatus.${status}`) }),
      'success'
    );
  };

  // Save feedback + attachment without changing status
  const handleSaveFeedback = async () => {
    if (!selected) return;
    setSavingFeedback(true);
    const extras = {
      reviewFeedback,
      adminAttachment: attachment ? attachment.dataUri : null,
      adminAttachmentName: attachment ? attachment.name : null,
    };
    const result = await updateApplicationStatus(selected.id, selected.status, extras);
    setSavingFeedback(false);
    if (!result.success) {
      showToast(result.error, 'error');
      return;
    }
    // Update the selected record so the "last saved review" block reflects the new values
    setSelected((s) =>
      s && (s.id === selected.id || s._id === selected.id)
        ? { ...s, reviewFeedback, adminAttachment: attachment?.dataUri || null, adminAttachmentName: attachment?.name || null }
        : s
    );
    await refresh();
    showToast('Review feedback saved successfully.', 'success');
  };

  const handleDeleteApplication = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteApplication(deleteTarget.id);
    setDeleting(false);
    if (!result.success) {
      showToast(result.error, 'error');
      return;
    }
    setApplications((current) => current.filter((application) => application.id !== deleteTarget.id));
    setDeleteTarget(null);
    setSelected(null);
    showToast(t('applicationDeleted', { name: deleteTarget.fullName }), 'success');
  };

  // Discard unsaved changes — reset panel to what was last saved on the record
  const handleCancelFeedback = () => {
    setReviewFeedback(selected?.reviewFeedback || '');
    setAttachment(
      selected?.adminAttachment
        ? { name: selected.adminAttachmentName || 'Attachment', dataUri: selected.adminAttachment }
        : null
    );
    setAttachError('');
  };  const handleExport = () => {
    exportToCSV(
      'admissions-applications',
      [
        { key: 'referenceNumber', header: t('reference') },
        { key: 'fullName', header: t('fullName') },
        { key: 'email', header: t('email') },
        { key: 'phone', header: t('phone') },
        { key: 'programLabel', header: t('program') },
        { key: 'status', header: t('status') },
        { key: 'submittedAt', header: t('submitted') },
      ],
      applications
    );
    showToast(t('applicationsExported'), 'success');
  };

  const dateLocale = language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB';

  const columns = [
    { key: 'referenceNumber', header: t('reference'), render: (a) => a.referenceNumber || a.id || '—' },
    { key: 'fullName', header: t('applicant') },
    { key: 'programLabel', header: t('program') },
    { key: 'email', header: t('email') },
    { key: 'phone', header: t('phone') },
    {
      key: 'submittedAt',
      header: t('submitted'),
      render: (a) => new Date(a.submittedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }),
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
        <div className="p-4 border-b border-[var(--color-border-gray)] space-y-3">
          <SearchBar value={search} onChange={setSearch} placeholder={t('searchApplications')} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setStatusFilter('all'); setPage(1); }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'all' ? 'border-[var(--color-medium-green)] bg-[var(--color-medium-green)] text-white' : 'border-[var(--color-border-gray)] bg-white text-[var(--color-dark-gray)] hover:border-[var(--color-medium-green)] hover:text-[var(--color-medium-green)]'}`}
            >
              {t('all') || 'All'}
            </button>
            {STATUS_OPTIONS.map((status) => {
              const count = applications.filter((app) => app.status === status).length;
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => { setStatusFilter(status); setPage(1); }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? 'border-[var(--color-medium-green)] bg-[var(--color-medium-green)] text-white' : 'border-[var(--color-border-gray)] bg-white text-[var(--color-dark-gray)] hover:border-[var(--color-medium-green)] hover:text-[var(--color-medium-green)]'}`}
                >
                  {t(`applicationStatus.${status}`)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-sm text-[var(--color-mid-gray)]">{t('loadingApplications')}</p>
        ) : applications.length === 0 ? (
          <EmptyState icon={GraduationCap} title={t('noApplicationsYet')} message={t('applicationsEmptyMessage')} />
        ) : (
          <>
            <DataTable columns={columns} data={paged} onRowClick={openApplication} />
            <TablePagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* ── Application detail modal ── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.fullName} size="lg">
        {selected && (
          <div>
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <StatusBadge status={selected.status} label={t(`applicationStatus.${selected.status}`)} />
              <span className="text-xs font-semibold tracking-wide text-[var(--color-medium-green)]">
                {selected.referenceNumber || selected.id || 'No reference'}
              </span>
              <span className="text-xs text-[var(--color-mid-gray)]">
                {t('appliedOn')}{' '}
                {new Date(selected.submittedAt).toLocaleString(dateLocale, {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>

            {/* Applicant details */}
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
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-mid-gray)]">{label}</p>
                    <p className="mt-0.5 text-[var(--color-dark-gray)]">{value}</p>
                  </div>
                ))}
              </div>

              {(selected.applicantPhoto || selected.supportingDocument) && (
                <div className="flex flex-wrap gap-3">
                  {selected.applicantPhoto && (
                    <a href={selected.applicantPhoto} download={`${selected.fullName}-photo`} className="text-sm font-semibold text-[var(--color-medium-green)] hover:underline">
                      Download applicant photo
                    </a>
                  )}
                  {selected.supportingDocument && (
                    <a href={selected.supportingDocument} download={`${selected.fullName}-document`} className="text-sm font-semibold text-[var(--color-medium-green)] hover:underline">
                      Download supporting document
                    </a>
                  )}
                </div>
              )}

              {selected.message && (
                <p className="flex items-start gap-2 text-[var(--color-dark-gray)]">
                  <MessageSquare className="w-4 h-4 text-[var(--color-medium-green)] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{selected.message}</span>
                </p>
              )}
            </div>

            {/* ── Review panel (visible to users with update permission) ── */}
            {hasPermission('applications.update') && (
              <div className="mt-6 rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-off-white)] p-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">
                  Review &amp; Decision
                </p>

                {/* Feedback textarea */}
                <div>
                  <label htmlFor="review-feedback" className="block text-xs font-semibold text-[var(--color-dark-gray)] mb-1">
                    Feedback message <span className="font-normal text-[var(--color-mid-gray)]">(visible to applicant)</span>
                  </label>
                  <textarea
                    id="review-feedback"
                    rows={4}
                    maxLength={5000}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Write a message for the applicant — e.g. next steps, missing documents, interview date…"
                    className="w-full rounded-lg border border-[var(--color-border-gray)] bg-white px-3 py-2 text-sm text-[var(--color-dark-gray)] placeholder:text-[var(--color-mid-gray)] focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)]/40 resize-y"
                  />
                  <p className="text-right text-[10px] text-[var(--color-mid-gray)] mt-0.5">
                    {reviewFeedback.length}/5000
                  </p>
                </div>

                {/* Admin attachment upload */}
                <div>
                  <p className="text-xs font-semibold text-[var(--color-dark-gray)] mb-1">
                    Attachment <span className="font-normal text-[var(--color-mid-gray)]">(optional file for applicant)</span>
                  </p>

                  {attachment ? (
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-gray)] bg-white px-3 py-2.5">
                      <Paperclip className="w-4 h-4 text-[var(--color-medium-green)] shrink-0" aria-hidden="true" />
                      <span className="flex-1 truncate text-sm text-[var(--color-dark-gray)]">{attachment.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-[var(--color-mid-gray)] hover:text-red-500 transition-colors"
                        aria-label="Remove attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--color-border-gray)] bg-white px-3 py-3 text-sm text-[var(--color-mid-gray)] hover:border-[var(--color-medium-green)] hover:text-[var(--color-medium-green)] transition-colors">
                      <Paperclip className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Click to attach a file (PDF, image · max 2 MB)</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                        className="sr-only"
                        onChange={handleAttachFile}
                      />
                    </label>
                  )}

                  {attachError && (
                    <p className="mt-1 text-xs text-red-500">{attachError}</p>
                  )}
                </div>

                {/* Status action buttons */}
                <div>
                  <p className="text-xs font-semibold text-[var(--color-mid-gray)] uppercase tracking-wide mb-2">
                    {t('updateStatus')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => {
                      const isActive = selected.status === status;
                      const isSaving = savingReview === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => !isActive && handleStatusChange(selected, status)}
                          disabled={isActive || savingReview !== null}
                          className="disabled:cursor-default"
                          aria-label={`Set status to ${status}`}
                        >
                          <StatusBadge
                            status={status}
                            label={isSaving ? 'Saving…' : t(`applicationStatus.${status}`)}
                            className={
                              isActive
                                ? 'ring-2 ring-offset-1 ring-[var(--color-medium-green)]'
                                : savingReview !== null
                                  ? 'opacity-40'
                                  : 'opacity-60 hover:opacity-100 transition-opacity cursor-pointer'
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--color-mid-gray)]">
                    Clicking a status will save it together with your feedback and attachment.
                  </p>
                </div>

                {/* Existing feedback/attachment display (read-only summary) */}
                {(selected.reviewFeedback || selected.adminAttachment) && (
                  <div className="rounded-lg border border-[var(--color-border-gray)] bg-white px-3 py-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-mid-gray)] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[var(--color-medium-green)]" aria-hidden="true" />
                      Last saved review
                    </p>
                    {selected.reviewFeedback && (
                      <p className="text-sm text-[var(--color-dark-gray)] leading-relaxed whitespace-pre-wrap">
                        {selected.reviewFeedback}
                      </p>
                    )}
                    {selected.adminAttachment && (
                      <a
                        href={selected.adminAttachment}
                        download={selected.adminAttachmentName || 'attachment'}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-medium-green)] hover:underline"
                      >
                        <Paperclip className="w-3 h-3" aria-hidden="true" />
                        {selected.adminAttachmentName || 'Download attachment'}
                      </a>
                    )}
                  </div>
                )}

                {/* ── Save / Cancel — bottom of review panel, covers all fields ── */}
                <div className="flex items-center gap-2 border-t border-[var(--color-border-gray)] pt-4">
                  <button
                    type="button"
                    onClick={handleSaveFeedback}
                    disabled={savingFeedback || savingReview !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-medium-green)] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--color-deep-green)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {savingFeedback ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelFeedback}
                    disabled={savingFeedback || savingReview !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-gray)] bg-white px-4 py-2 text-xs font-semibold text-[var(--color-dark-gray)] transition hover:border-[var(--color-mid-gray)] hover:text-[var(--color-mid-gray)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    Cancel
                  </button>
                </div>

              </div>
            )}

            <div className="flex justify-end mt-5">
              <div className="flex items-center gap-2">
                {hasPermission('applications.update') && (
                  <Button variant="danger" onClick={() => setDeleteTarget(selected)} icon={Trash2}>
                    {t('deleteApplication')}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setSelected(null)} icon={X}>{t('close')}</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteApplication}
        title={t('deleteApplication')}
        message={t('confirmDeleteApplication', { name: deleteTarget?.fullName || '' })}
        confirmLabel={t('delete')}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
