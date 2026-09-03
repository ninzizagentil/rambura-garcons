import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, KeyRound, Camera, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My Profile" description="Your account details." />
      <div className="animate-[fadeInUp_.45s_ease-out_both] motion-reduce:animate-none overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] shadow-[0_16px_40px_rgba(15,108,255,0.08)]">
        <div className="relative flex animate-[fadeInUp_.45s_.08s_ease-out_both] motion-reduce:animate-none items-center gap-4 overflow-hidden border-b border-[var(--color-border-gray)] bg-[linear-gradient(135deg,var(--surface-hover),var(--color-white))] p-6">
          <div className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full border-[18px] border-[var(--gold)]/10" aria-hidden="true" />
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
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePick}
                disabled={uploading}
                className="rounded-lg border border-[var(--gold)]/25 bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-medium-green)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--gold)] disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : user?.avatar ? 'Change photo' : 'Upload photo'}
              </button>
              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--color-status-red)] transition-colors hover:bg-[var(--color-status-red-bg)]"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <dl className="grid animate-[fadeInUp_.45s_.16s_ease-out_both] motion-reduce:animate-none gap-2 p-6 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border-gray)] p-3 transition-colors hover:border-[var(--gold)]/40 hover:bg-[var(--surface-hover)]">
            <Mail className="w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
            <dt className="sr-only">Email</dt>
            <dd className="text-[var(--color-dark-gray)]">{user?.email}</dd>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border-gray)] p-3 transition-colors hover:border-[var(--gold)]/40 hover:bg-[var(--surface-hover)]">
            <ShieldCheck className="w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
            <dt className="sr-only">Status</dt>
            <dd className="text-[var(--color-dark-gray)] capitalize">{user?.status}</dd>
          </div>
        </dl>
        <Link
          to="/change-password"
          className="group mx-6 mb-6 flex animate-[fadeInUp_.45s_.24s_ease-out_both] motion-reduce:animate-none items-center gap-3 rounded-xl border border-[var(--gold)]/25 bg-[var(--surface-hover)] p-3 text-sm font-semibold text-[var(--color-medium-green)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)] hover:shadow-[0_10px_22px_rgba(15,108,255,0.10)]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] shadow-sm"><KeyRound className="h-4 w-4" aria-hidden="true" /></span>
          <span className="flex-1">Change Password<span className="mt-0.5 block text-xs font-normal text-[var(--color-mid-gray)]">Keep your account protected</span></span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
