import { useState, useEffect } from 'react';
import Modal from '../../components/modals/Modal';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import ImageField from '../../components/forms/ImageField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { BOOK_CATEGORIES } from '../../data/library';
import { createBook, updateBook } from '../../services/bookService';

const EMPTY_FORM = { title: '', author: '', category: '', bookCode: '', description: '', totalCopies: '', coverImage: '' };

export default function BookFormModal({ open, onClose, book, onSaved }) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { t } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!book;

  useEffect(() => {
    if (open) {
      setForm(book ? { ...book, totalCopies: String(book.totalCopies) } : EMPTY_FORM);
      setErrors({});
      setServerError('');
    }
  }, [open, book]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.title?.trim()) next.title = t('titleRequired');
    if (!form.author?.trim()) next.author = t('authorRequired');
    if (!form.category) next.category = t('categoryRequired');
    if (!form.bookCode?.trim()) next.bookCode = t('bookCodeRequired');
    const copies = Number(form.totalCopies);
    if (!form.totalCopies || Number.isNaN(copies) || copies <= 0) next.totalCopies = t('positiveCopiesRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);

    const result = isEdit
      ? await updateBook(book.id, { ...form, totalCopies: Number(form.totalCopies) })
      : await createBook(form);
    setSaving(false);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    showToast(isEdit ? t('bookUpdated') : t('bookAdded'), 'success');
    addNotification({
      type: 'library',
      message: isEdit ? t('bookUpdatedInCatalogue', { title: form.title }) : t('bookAddedToCatalogue', { title: form.title }),
      to: '/library/books',
    });
    onSaved(result.book);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('editBook') : t('addBook')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>{isEdit ? t('saveChanges') : t('saveBook')}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <ImageField
          label={t('coverPhoto')}
          hint={t('coverPhotoHint')}
          value={form.coverImage}
          onChange={(dataUrl) => setForm((f) => ({ ...f, coverImage: dataUrl }))}
        />
        <Input label={t('title')} required value={form.title} onChange={update('title')} error={errors.title} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label={t('author')} required value={form.author} onChange={update('author')} error={errors.author} />
          <Select
            label={t('category')}
            required
            value={form.category}
            onChange={update('category')}
            error={errors.category}
            options={BOOK_CATEGORIES.map((c) => ({ value: c, label: t(`bookCategory.${c}`) }))}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label={t('bookCodeIsbn')} required value={form.bookCode} onChange={update('bookCode')} error={errors.bookCode} disabled={isEdit} />
          <Input label={t('numberOfCopies')} type="number" min="1" required value={form.totalCopies} onChange={update('totalCopies')} error={errors.totalCopies} />
        </div>
        <Textarea label={t('description')} value={form.description} onChange={update('description')} rows={3} />
      </form>
    </Modal>
  );
}
