import { useState } from 'react';
import { Input, Select } from '../../components/forms/FormField';
import CreatableSelect from '../../components/forms/CreatableSelect';
import Modal from '../../components/modals/Modal';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { borrowBook, getLoans } from '../../services/bookService';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { applyKindErrors } from '../../utils/validators';

function today() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function emptyForm() {
  const borrowDate = today();
  return { borrower: '', borrowerType: 'Student', studentClassYear: '', borrowDate, dueDate: addDays(borrowDate, 14) };
}

// What each field may contain (letters only, numbers only, phone, email…) — see utils/validators.js
const FIELD_KINDS = {
  borrower: 'name',
};

export default function BorrowModal({ open, onClose, book, onBorrowed }) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { t } = useApp();
  const [step, setStep] = useState('form'); // form | confirm
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep('form');
    setForm(emptyForm());
    setErrors({});
    setServerError('');
  };

  const bookId = book?.id;

  // Reset when the modal opens for a book (or the book changes while open).
  // Done during render instead of in an effect — see
  // https://react.dev/learn/you-might-not-need-an-effect
  const [resetKey, setResetKey] = useState(null);
  const nextResetKey = open && bookId ? bookId : null;
  if (resetKey !== nextResetKey) {
    setResetKey(nextResetKey);
    if (nextResetKey !== null) reset();
  }

  const handleClose = () => {
    reset();
    onClose();
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const classOptions = [...new Set([...getLoans().map((loan) => loan.studentClassYear), form.studentClassYear].filter(Boolean))]
    .map((classLevel) => ({ value: classLevel, label: classLevel }));

  const validate = () => {
    const next = {};
    if (!form.borrower?.trim()) next.borrower = t('borrowerNameRequired');
    if (form.borrowerType === 'Student' && !form.studentClassYear?.trim()) next.studentClassYear = t('classYearRequired');
    if (!form.dueDate) next.dueDate = t('dueDateRequired');
    if (form.borrowDate && form.dueDate && form.dueDate < form.borrowDate) next.dueDate = t('dueDateBeforeBorrowDate');
    applyKindErrors(next, form, FIELD_KINDS, t);
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
    showToast(t('bookBorrowedBy', { title: book.title, borrower: form.borrower }), 'success');
    addNotification({
      type: 'borrow',
      message: t('bookBorrowedNotification', { title: book.title, borrower: form.borrower, dueDate: form.dueDate }),
      to: '/library/borrowed',
    });
    onBorrowed();
    reset();
  };

  if (!book) return null;

  return (
    <Modal open={open} onClose={handleClose} title={t('borrowBookNamed', { title: book.title })}>
      {book.availableCopies <= 0 ? (
        <Alert type="error" title={t('insufficientAvailability')}>
          {t('noAvailableCopies')}
        </Alert>
      ) : step === 'form' ? (
        <form onSubmit={handleContinue} noValidate className="space-y-4">
          <p className="text-xs text-[var(--color-mid-gray)]">{t('copiesAvailable', { available: book.availableCopies, total: book.totalCopies })}</p>
          <Input kind="name"
            label={t('borrowerName')}
            required
            value={form.borrower}
            onChange={update('borrower')}
            error={errors.borrower}
            placeholder={t('enterBorrowerName')}
            autoComplete="name"
            hint={t('borrowerNameHint')}
          />
          <Select
            label={t('borrowerType')}
            value={form.borrowerType}
            onChange={(e) => {
              const nextType = e.target.value;
              setForm((f) => ({ ...f, borrowerType: nextType, studentClassYear: nextType === 'Student' ? f.studentClassYear : '' }));
            }}
            options={[{ value: 'Student', label: t('student') }, { value: 'Staff', label: t('staff') }]}
          />
          {form.borrowerType === 'Student' && (
            <CreatableSelect
              label={t('classLevel')}
              required
              value={form.studentClassYear}
              onChange={update('studentClassYear')}
              error={errors.studentClassYear}
              options={classOptions}
              addLabel="+ Other"
            />
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={t('borrowDate')} type="date" value={form.borrowDate} onChange={update('borrowDate')} />
            <Input label={t('dueDate')} type="date" required value={form.dueDate} onChange={update('dueDate')} error={errors.dueDate} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>{t('cancel')}</Button>
            <Button type="submit" variant="primary">{t('continue')}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {serverError && <Alert type="error">{serverError}</Alert>}
          <p className="text-sm text-[var(--color-dark-gray)]">{t('confirmDetailsBelow')}</p>
          <dl className="text-sm bg-[var(--color-off-white)] rounded-[var(--radius-control)] p-4 space-y-1.5">
            <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('bookTitle')}</dt><dd className="font-medium">{book.title}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('borrowedBy')}</dt><dd className="font-medium">{form.borrower} ({form.borrowerType === 'Student' ? t('student') : t('staff')})</dd></div>
            {form.borrowerType === 'Student' && (
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('classLevel')}</dt><dd className="font-medium">{form.studentClassYear}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('dueDate')}</dt><dd className="font-medium">{form.dueDate}</dd></div>
          </dl>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setStep('form')} disabled={saving}>{t('back')}</Button>
            <Button variant="primary" onClick={handleConfirm} loading={saving}>{t('confirmBorrow')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
