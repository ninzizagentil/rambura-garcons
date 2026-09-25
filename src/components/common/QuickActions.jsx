import { Link } from 'react-router-dom';
import Button from './Button';

export default function QuickActions({ actions }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map(({ label, to, icon: Icon, variant = 'secondary' }) => (
        <Link key={to} to={to}>
          <Button size="sm" variant={variant} icon={Icon}>
            {label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
