import { useId, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// Keeps the demo's localStorage-backed persistence happy — large uploaded
// photos are downscaled and re-encoded as JPEG before being stored.
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15MB — sanity cap before we even try to read it

function readAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (PNG, JPG, WEBP…).'));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      reject(new Error('That image is too large — please pick one under 15MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * ImageField — lets the admin browse their computer for a photo instead of
 * pasting a URL. The chosen file is resized/compressed client-side and
 * handed back via onChange as a data URL, which drops straight into the
 * same string field an "Image URL" input used to fill.
 */
export default function ImageField({ label, required, hint, value, onChange, className = '' }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await readAndCompressImage(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err.message || 'Could not use that image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-sm font-medium text-[var(--color-dark-gray)]">
          {label} {required && <span className="text-[var(--color-status-red)]" aria-hidden="true">*</span>}
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-[var(--color-soft-gray)] border border-[var(--color-border-gray)]">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-mid-gray)] text-[10px]">
              No photo
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <button
            id={inputId}
            type="button"
            onClick={handlePick}
            disabled={busy}
            className="inline-flex items-center gap-1.5 self-start rounded-[var(--radius-control)] border border-[var(--color-border-gray)] bg-[var(--color-deep-green-600)] px-3 py-1.5 text-xs font-semibold text-[var(--color-light-green)] hover:bg-[var(--color-deep-green)] transition-colors disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            {busy ? 'Reading photo…' : value ? 'Change photo…' : 'Browse…'}
          </button>
          {value && !busy && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 self-start text-xs text-[var(--color-mid-gray)] hover:text-[var(--color-status-red)] transition-colors"
            >
              <X className="w-3 h-3" aria-hidden="true" /> Remove photo
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-labelledby={label ? undefined : inputId}
          onChange={handleFile}
        />
      </div>
      {hint && !error && <p className="text-xs text-[var(--color-mid-gray)]">{hint}</p>}
      {error && <p className="text-xs font-medium text-[var(--color-status-red)]" role="alert">{error}</p>}
    </div>
  );
}
