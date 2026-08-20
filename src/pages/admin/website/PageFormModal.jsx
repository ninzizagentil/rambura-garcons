import { useState, useEffect } from 'react';
import Modal from '../../../components/modals/Modal';
import { Input, Textarea } from '../../../components/forms/FormField';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { updatePage } from '../../../services/contentService';

export default function PageFormModal({ open, onClose, page, onSaved }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ heroBadge: '', heroTitle: '', heroSubtitle: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && page) {
      setForm({ heroBadge: page.heroBadge || '', heroTitle: page.heroTitle || '', heroSubtitle: page.heroSubtitle || '' });
      setErrors({});
      setServerError('');
    }
  }, [open, page]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.heroTitle?.trim()) next.heroTitle = 'Title is required.';
    if (!form.heroSubtitle?.trim()) next.heroSubtitle = 'Subtitle is required.';
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
      showToast(`"${page.name}" page updated successfully.`, 'success');
      onSaved();
    }, 300);
  };

  if (!page) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit "${page.name}" Page`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>Save Changes</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <p className="text-xs text-[var(--color-mid-gray)] -mt-1">
          This content appears in the banner at the top of the public <span className="font-medium">{page.route}</span> page.
        </p>
        {page.id === 'home' && (
          <Input label="Badge Text" value={form.heroBadge} onChange={update('heroBadge')} hint="Small label shown above the headline." />
        )}
        <Input label="Title" required value={form.heroTitle} onChange={update('heroTitle')} error={errors.heroTitle} />
        <Textarea label="Subtitle" required rows={3} value={form.heroSubtitle} onChange={update('heroSubtitle')} error={errors.heroSubtitle} />
      </form>
    </Modal>
  );
}
