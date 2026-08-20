import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Compass } from 'lucide-react';
import Button from '../../components/common/Button';

export function SuccessPage({ title = 'Success', message = 'Your action was completed successfully.', backTo = '/', backLabel = 'Continue' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-off-white)] px-4">
      <div className="text-center max-w-sm">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-status-green-bg)] mb-5">
          <CheckCircle2 className="w-8 h-8 text-[var(--color-status-green)]" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold text-[var(--color-dark-gray)]">{title}</h1>
        <p className="text-sm text-[var(--color-mid-gray)] mt-2">{message}</p>
        <Link to={backTo} className="inline-block mt-6">
          <Button variant="primary">{backLabel}</Button>
        </Link>
      </div>
    </div>
  );
}

export function ErrorPage({ title = 'Something went wrong', message = 'An unexpected error occurred. Please try again.' }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-off-white)] px-4">
      <div className="text-center max-w-sm">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-status-red-bg)] mb-5">
          <XCircle className="w-8 h-8 text-[var(--color-status-red)]" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold text-[var(--color-dark-gray)]">{title}</h1>
        <p className="text-sm text-[var(--color-mid-gray)] mt-2">{message}</p>
        <Button variant="primary" className="mt-6" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-off-white)] px-4">
      <div className="text-center max-w-sm">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-light-green-100)] mb-5">
          <Compass className="w-8 h-8 text-[var(--color-medium-green)]" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold text-[var(--color-dark-gray)]">Page Not Found</h1>
        <p className="text-sm text-[var(--color-mid-gray)] mt-2">The page you're looking for doesn't exist or may have moved.</p>
        <Link to="/" className="inline-block mt-6">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
