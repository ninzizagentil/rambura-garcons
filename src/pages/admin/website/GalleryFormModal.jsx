import { useState, useEffect } from 'react';
import Modal from '../../../components/modals/Modal';
import { Input } from '../../../components/forms/FormField';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useApp } from '../../../context/AppContext';
import { createGalleryImage, updateGalleryImage } from '../../../services/contentService';

export default function GalleryFormModal({ open, onClose, image, onSaved }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useApp();
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!image;

  useEffect(() => {
    if (open) {
      setCaption(image?.caption || '');
      setError('');
      setServerError('');
    }
  }, [open, image]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!caption.trim()) {
      setError(t('captionRequired'));
      return;
    }
    setSaving(true);
    const actor = user?.fullName || 'System Administrator';
    const result = isEdit ? await updateGalleryImage(image.id, { caption }, actor) : await createGalleryImage({ caption }, actor);
    setSaving(false);
    if (!result.success) { setServerError(result.error); return; }
    showToast(isEdit ? t('imageUpdatedSuccessfully') : t('imageAddedSuccessfully'), 'success');
    onSaved();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('editGalleryImage') : t('addGalleryImage')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>{isEdit ? t('saveChanges') : t('addImage')}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input
          label={t('caption')}
          required
          value={caption}
          onChange={(e) => { setCaption(e.target.value); if (error) setError(''); }}
          error={error}
          hint={t('galleryCaptionHint')}
        />
      </form>
    </Modal>
  );
}
