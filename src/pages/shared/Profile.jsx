import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, KeyRound, Camera, Trash2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Avatar from '../../components/common/Avatar';
import { ROLE_LABELS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB

export default function Profile() {
  const { user, updateAvatar } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file (PNG, JPG, etc.).', 'error');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showToast('Image is too large. Please choose one under 2MB.', 'error');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await updateAvatar(reader.result);
        showToast('Profile photo updated.', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploading(false);
      showToast('Could not read that image. Please try another file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = async () => {
    try { await updateAvatar(null); showToast('Profile photo removed.', 'success'); }
    catch (error) { showToast(error.message, 'error'); }
  };

  return (
    <div>
      <PageHeader title="My Profile" description="Your account details." />
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar name={user?.fullName} src={user?.avatar} size="lg" />
            <button
              type="button"
              onClick={handlePick}
              disabled={uploading}
              aria-label="Change profile photo"
              title="Change profile photo"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--color-medium-green)] text-white flex items-center justify-center border-2 border-white hover:bg-[var(--color-deep-green-600)] disabled:opacity-60"
            >
              <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
              aria-hidden="true"
            />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">{user?.fullName}</p>
            <p className="text-sm text-[var(--color-mid-gray)]">{ROLE_LABELS[user?.role]}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                type="button"
                onClick={handlePick}
                disabled={uploading}
                className="text-xs font-semibold text-[var(--color-medium-green)] hover:underline disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : user?.avatar ? 'Change photo' : 'Upload photo'}
              </button>
              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-status-red)] hover:underline"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <dl className="space-y-3 text-sm border-t border-[var(--color-border-gray)] pt-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
            <dt className="sr-only">Email</dt>
            <dd className="text-[var(--color-dark-gray)]">{user?.email}</dd>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
            <dt className="sr-only">Status</dt>
            <dd className="text-[var(--color-dark-gray)] capitalize">{user?.status}</dd>
          </div>
        </dl>
        <Link
          to="/change-password"
          className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-[var(--color-medium-green)] hover:underline"
        >
          <KeyRound className="w-4 h-4" aria-hidden="true" /> Change Password
        </Link>
      </div>
    </div>
  );
}
