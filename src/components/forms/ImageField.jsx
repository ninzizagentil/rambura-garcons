import { useId, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// Keep uploaded branding sharp without flattening transparent logos into a
// lossy JPEG. PNG is the safest format for badges and crests because it keeps
// the transparent background and crisp edges that schools expect.
const MAX_DIMENSION = 1800;
const JPEG_QUALITY = 0.9;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15MB — sanity cap before we even try to read it

function readAndCompressImage(file, { maxDimension = MAX_DIMENSION, preserveTransparency = true } = {}) {
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
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const isTransparentLogo = preserveTransparency && (file.type === 'image/png' || file.type === 'image/webp');
        const format = isTransparentLogo ? 'image/png' : 'image/jpeg';
        const output = format === 'image/jpeg'
          ? canvas.toDataURL(format, JPEG_QUALITY)
          : canvas.toDataURL(format);

        resolve(output);
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
export default function ImageField({ label, required, hint, value, onChange, className = '', maxDimension = MAX_DIMENSION, preserveTransparency = true, dark = false }) {
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
      const dataUrl = await readAndCompressImage(file, { maxDimension, preserveTransparency });
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
        <span className={cn('text-sm font-medium', dark ? 'text-[var(--text-primary)]' : 'text-[var(--color-dark-gray)]')}>
          {label} {required && <span className="text-[var(--color-status-red)]" aria-hidden="true">*</span>}
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className={cn('w-20 h-20 shrink-0 overflow-hidden rounded-lg', dark ? 'bg-[rgba(7,22,20,0.9)]' : 'bg-[var(--color-white)]')}>
          {value ? (
            <img src={value} alt="School logo preview" className="h-full w-full object-contain p-0" />
          ) : (
            <div className={cn('flex h-full w-full flex-col items-center justify-center gap-1', dark ? 'bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]' : 'bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)]')}>
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">Logo</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <button
            id={inputId}
            type="button"
            onClick={handlePick}
            disabled={busy}
            className={cn(
              'inline-flex items-center gap-1.5 self-start rounded-[var(--radius-control)] border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60',
              dark
                ? 'border-white/10 bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)]'
                : 'border-[var(--color-border-gray)] bg-[linear-gradient(135deg,var(--color-deep-green-600),var(--color-deep-green))] text-[var(--color-light-green)]'
            )}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            {busy ? 'Reading logo…' : value ? 'Change logo…' : 'Upload logo…'}
          </button>
          {value && !busy && (
            <button
              type="button"
              onClick={() => onChange('')}
              className={cn('inline-flex items-center gap-1 self-start text-xs transition-colors', dark ? 'text-[var(--text-secondary)] hover:text-[var(--color-gold)]' : 'text-[var(--color-mid-gray)] hover:text-[var(--color-status-red)]')}
            >
              <X className="w-3 h-3" aria-hidden="true" /> Remove logo
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
      {hint && !error && <p className={cn('text-xs', dark ? 'text-[var(--text-secondary)]' : 'text-[var(--color-mid-gray)]')}>{hint}</p>}
      {error && <p className="text-xs font-medium text-[var(--color-status-red)]" role="alert">{error}</p>}
    </div>
  );
}
