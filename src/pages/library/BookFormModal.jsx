import { useState, useEffect } from 'react';
import Modal from '../../components/modals/Modal';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import ImageField from '../../components/forms/ImageField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { BOOK_CATEGORIES } from '../../data/library';
import { createBook, updateBook } from '../../services/bookService';

const EMPTY_FORM = { title: '', author: '', category: '', bookCode: '', description: '', totalCopies: '', coverImage: '' };

export default function BookFormModal({ open, onClose, book, onSaved }) {
  const { showToast } = useToast();
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
    if (!form.title?.trim()) next.title = 'Title is required.';
    if (!form.author?.trim()) next.author = 'Author is required.';
    if (!form.category) next.category = 'Select a category.';
    if (!form.bookCode?.trim()) next.bookCode = 'Book Code / ISBN is required.';
    const copies = Number(form.totalCopies);
    if (!form.totalCopies || Number.isNaN(copies) || copies <= 0) next.totalCopies = 'Enter a positive number of copies.';
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
    showToast(isEdit ? 'Book updated successfully.' : 'Book added to catalogue.', 'success');
    onSaved(result.book);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Book' : 'Add Book'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>{isEdit ? 'Save Changes' : 'Save Book'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <ImageField
          label="Cover Photo"
          hint="Optional — shown on the book's catalogue entry and details page."
          value={form.coverImage}
          onChange={(dataUrl) => setForm((f) => ({ ...f, coverImage: dataUrl }))}
        />
        <Input label="Title" required value={form.title} onChange={update('title')} error={errors.title} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Author" required value={form.author} onChange={update('author')} error={errors.author} />
          <Select
            label="Category"
            required
            value={form.category}
            onChange={update('category')}
            error={errors.category}
            options={BOOK_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Book Code / ISBN" required value={form.bookCode} onChange={update('bookCode')} error={errors.bookCode} disabled={isEdit} />
          <Input label="Number of Copies" type="number" min="1" required value={form.totalCopies} onChange={update('totalCopies')} error={errors.totalCopies} />
        </div>
        <Textarea label="Description" value={form.description} onChange={update('description')} rows={3} />
      </form>
    </Modal>
  );
}
