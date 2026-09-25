import Modal from './Modal';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}) {
  const { t } = useApp();
  const resolvedTitle = title === 'Confirm action' ? t('confirmAction') : title;
  const resolvedConfirmLabel = confirmLabel === 'Confirm' ? t('confirm') : confirmLabel;
  const resolvedCancelLabel = cancelLabel === 'Cancel' ? t('cancel') : cancelLabel;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={resolvedTitle}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {resolvedCancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {resolvedConfirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--color-mid-gray)]">{message}</p>
    </Modal>
  );
}
