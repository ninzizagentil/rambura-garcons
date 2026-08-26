import { useState } from 'react';
import { Input, Select } from '../../components/forms/FormField';
import Modal from '../../components/modals/Modal';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { borrowBook } from '../../services/bookService';
import { useToast } from '../../context/ToastContext';

const TODAY = '2026-08-18';
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const EMPTY_FORM = { borrower: '', borrowerType: 'Student', borrowDate: TODAY, dueDate: addDays(TODAY, 14) };

export default function BorrowModal({ open, onClose, book, onBorrowed }) {
  const { showToast } = useToast();
  const [step, setStep] = useState('form'); // form | confirm
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep('form');
    setForm(EMPTY_FORM);
    setErrors({});
    setServerError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.borrower?.trim()) next.borrower = 'Borrower name is required.';
    if (!form.dueDate) next.dueDate = 'Due date is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validate()) setStep('confirm');
  };

  const handleConfirm = async () => {
    setSaving(true);
    setServerError('');
    const result = await borrowBook({ bookId: book.id, ...form });
    setSaving(false);
    if (!result.success) {
      setServerError(result.error);
      setStep('form');
      return;
    }
    showToast(`"${book.title}" borrowed by ${form.borrower}.`, 'success');
    onBorrowed();
    reset();
  };

  if (!book) return null;

  return (
    <Modal open={open} onClose={handleClose} title={`Borrow "${book.title}"`}>
      {book.availableCopies <= 0 ? (
        <Alert type="error" title="Insufficient availability">
          There are no available copies of this book to borrow right now.
        </Alert>
      ) : step === 'form' ? (
        <form onSubmit={handleContinue} noValidate className="space-y-4">
          <p className="text-xs text-[var(--color-mid-gray)]">{book.availableCopies} of {book.totalCopies} copies available.</p>
          <Input label="Borrower" required value={form.borrower} onChange={update('borrower')} error={errors.borrower} placeholder="Full name" />
          <Select
            label="Borrower Type"
            value={form.borrowerType}
            onChange={update('borrowerType')}
            options={[{ value: 'Student', label: 'Student' }, { value: 'Staff', label: 'Staff' }]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Borrowing Date" type="date" value={form.borrowDate} onChange={update('borrowDate')} />
            <Input label="Due Date" type="date" required value={form.dueDate} onChange={update('dueDate')} error={errors.dueDate} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="primary">Continue</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {serverError && <Alert type="error">{serverError}</Alert>}
          <p className="text-sm text-[var(--color-dark-gray)]">Please confirm the details below:</p>
          <dl className="text-sm bg-[var(--color-off-white)] rounded-[var(--radius-control)] p-4 space-y-1.5">
            <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Book</dt><dd className="font-medium">{book.title}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Borrower</dt><dd className="font-medium">{form.borrower} ({form.borrowerType})</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Due Date</dt><dd className="font-medium">{form.dueDate}</dd></div>
          </dl>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setStep('form')} disabled={saving}>Back</Button>
            <Button variant="primary" onClick={handleConfirm} loading={saving}>Confirm Borrow</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
