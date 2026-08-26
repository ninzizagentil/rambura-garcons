import { useState, useEffect } from 'react';
import Modal from '../../../components/modals/Modal';
import { Input, Textarea } from '../../../components/forms/FormField';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { createNews, updateNews } from '../../../services/contentService';

const EMPTY_FORM = { title: '', date: new Date().toISOString().slice(0, 10), excerpt: '', content: '' };

export default function NewsFormModal({ open, onClose, article, onSaved }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!article;

  useEffect(() => {
    if (open) {
      setForm(article ? { title: article.title, date: article.date, excerpt: article.excerpt, content: article.content } : EMPTY_FORM);
      setErrors({});
      setServerError('');
    }
  }, [open, article]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.title?.trim()) next.title = 'Title is required.';
    if (!form.date) next.date = 'Date is required.';
    if (!form.excerpt?.trim()) next.excerpt = 'A short excerpt is required.';
    if (!form.content?.trim()) next.content = 'Article content is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    const actor = user?.fullName || 'System Administrator';
    const result = isEdit ? await updateNews(article.id || article.slug, form, actor) : await createNews(form, actor);
    setSaving(false);
    if (!result.success) { setServerError(result.error); return; }
    showToast(isEdit ? 'Article updated successfully.' : 'Article published successfully.', 'success');
    onSaved();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit News Article' : 'Add News Article'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>{isEdit ? 'Save Changes' : 'Publish Article'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input label="Title" required value={form.title} onChange={update('title')} error={errors.title} />
        <Input label="Date" type="date" required value={form.date} onChange={update('date')} error={errors.date} />
        <Textarea label="Excerpt" required rows={2} value={form.excerpt} onChange={update('excerpt')} error={errors.excerpt} hint="Short summary shown on the News listing page." />
        <Textarea label="Full Content" required rows={6} value={form.content} onChange={update('content')} error={errors.content} hint="Full article body shown on the article page." />
      </form>
    </Modal>
  );
}
