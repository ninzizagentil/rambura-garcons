import { useState } from 'react';
import Modal from '../../../components/modals/Modal';
import { Input, Textarea } from '../../../components/forms/FormField';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useApp } from '../../../context/AppContext';
import { updatePage } from '../../../services/contentService';

export default function PageFormModal({ open, onClose, page, onSaved }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useApp();
  const [form, setForm] = useState({ heroBadge: '', heroTitle: '', heroSubtitle: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset the form when the modal transitions to open for a given page,
  // computed during render instead of in an effect — see
  // https://react.dev/learn/you-might-not-need-an-effect
  const [resetKey, setResetKey] = useState(null);
  const nextResetKey = open && page ? (page.id ?? page._id) : null;
  if (open && page && resetKey !== nextResetKey) {
    setResetKey(nextResetKey);
    setForm({ heroBadge: page.heroBadge || '', heroTitle: page.heroTitle || '', heroSubtitle: page.heroSubtitle || '' });
    setErrors({});
    setServerError('');
  } else if ((!open || !page) && resetKey !== null) {
    setResetKey(null);
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.heroTitle?.trim()) next.heroTitle = t('titleRequired');
    if (!form.heroSubtitle?.trim()) next.heroSubtitle = t('subtitleRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const updates = { heroTitle: form.heroTitle, heroSubtitle: form.heroSubtitle };
      if (page.id === 'home') updates.heroBadge = form.heroBadge;
      const result = updatePage(page.id, updates, user?.fullName || 'System Administrator');
      setSaving(false);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      showToast(t('pageUpdated', { page: page.name }), 'success');
      onSaved();
    }, 300);
  };

  if (!page) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('editPage', { page: page.name })}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>{t('saveChanges')}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <p className="text-xs text-[var(--color-mid-gray)] -mt-1">
          {t('pageBannerHint', { route: page.route })}
        </p>
        {page.id === 'home' && (
          <Input label={t('badgeText')} value={form.heroBadge} onChange={update('heroBadge')} hint={t('badgeTextHint')} />
        )}
        <Input label={t('title')} required value={form.heroTitle} onChange={update('heroTitle')} error={errors.heroTitle} />
        <Textarea label={t('subtitle')} required rows={3} value={form.heroSubtitle} onChange={update('heroSubtitle')} error={errors.heroSubtitle} />
      </form>
    </Modal>
  );
}
