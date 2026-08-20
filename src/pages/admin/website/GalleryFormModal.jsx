import { useState, useEffect } from 'react';
import Modal from '../../../components/modals/Modal';
import { Input } from '../../../components/forms/FormField';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { createGalleryImage, updateGalleryImage } from '../../../services/contentService';

export default function GalleryFormModal({ open, onClose, image, onSaved }) {
  const { user } = useAuth();
  const { showToast } = useToast();
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError('');
    if (!caption.trim()) {
      setError('Caption is required.');
      return;
    }
    setSaving(true);
    const actor = user?.fullName || 'System Administrator';
    setTimeout(() => {
      const result = isEdit ? updateGalleryImage(image.id, { caption }, actor) : createGalleryImage({ caption }, actor);
      setSaving(false);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      showToast(isEdit ? 'Image updated successfully.' : 'Image added successfully.', 'success');
      onSaved();
    }, 300);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Gallery Image' : 'Add Gallery Image'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>{isEdit ? 'Save Changes' : 'Add Image'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input
          label="Caption"
          required
          value={caption}
          onChange={(e) => { setCaption(e.target.value); if (error) setError(''); }}
          error={error}
          hint="A representative photo is generated automatically for this entry on the public Gallery page."
        />
      </form>
    </Modal>
  );
}
