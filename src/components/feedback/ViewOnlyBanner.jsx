import { Eye } from 'lucide-react';
import Alert from './Alert';

export default function ViewOnlyBanner({ module = 'module' }) {
  return (
    <Alert type="info" title="View-only access" className="mb-4">
      <span className="inline-flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
        You're viewing the {module} for oversight. Adding, editing, and other actions are reserved for that module's assigned staff.
      </span>
    </Alert>
  );
}
