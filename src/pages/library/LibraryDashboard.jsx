import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, BookMarked, AlertTriangle, Layers3, ClipboardList } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import QuickActions from '../../components/common/QuickActions';
import StatCard from '../../components/cards/StatCard';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { getBooks, getLoans, refreshLibrary, daysOverdue } from '../../services/bookService';

export default function LibraryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useApp();
  const { can } = useModuleAccess(ROLES.LIBRARIAN, 'library');

  const [libraryVersion, setLibraryVersion] = useState(0);
  const books = useMemo(() => { void libraryVersion; return getBooks(); }, [libraryVersion]);
  const loans = useMemo(() => { void libraryVersion; return getLoans(); }, [libraryVersion]);

  useEffect(() => {
    const handleUpdate = () => setLibraryVersion((version) => version + 1);
    window.addEventListener('rg:library-updated', handleUpdate);
    refreshLibrary().catch(() => {});
    return () => window.removeEventListener('rg:library-updated', handleUpdate);
  }, []);

  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const activeLoans = loans.filter((l) => l.status !== 'returned');
  const overdueLoans = activeLoans.filter((l) => daysOverdue(l.dueDate) > 0);
  const onLoanCopies = Math.max(totalCopies - availableCopies, 0);
  const availableRate = totalCopies ? Math.round((availableCopies / totalCopies) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('libraryDashboard')}
        description={t('welcomeBack', { name: user?.fullName?.split(' ')[0] || 'Marie' })}
        breadcrumb={[
          { label: 'Library', to: '/library' },
          { label: t('libraryDashboard') },
        ]}
        actions={(can('library.books.create') || can('library.borrow') || can('library.return')) ? <QuickActions actions={[
            can('library.books.create') && { label: t('addBook'), to: '/library/books', icon: BookOpen },
            can('library.borrow') && { label: t('borrowBook'), to: '/library/books', icon: BookMarked },
            can('library.return') && { label: t('processReturn'), to: '/library/returns', icon: CheckCircle2 },
          ].filter(Boolean)} /> : null}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('totalBooks')} value={books.length} icon={BookOpen} onClick={() => navigate('/library/books')} />
        <StatCard label={t('availableCopies')} value={availableCopies} icon={CheckCircle2} onClick={() => navigate('/library/books')} />
        <StatCard label={t('activeLoans')} value={activeLoans.length} icon={BookMarked} onClick={() => navigate('/library/borrowed')} />
        <StatCard label={t('overdue')} value={overdueLoans.length} icon={AlertTriangle} tone="red" onClick={() => navigate('/library/overdue')} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.95fr] gap-4">
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[var(--color-mid-gray)]">{t('librarySummary')}</p>
              <h2 className="font-display text-xl font-semibold text-[var(--color-heading)] mt-2">{t('operationsSnapshot')}</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-light-green)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] bg-[var(--color-light-green-100)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-medium-green)]" />
              {availableRate}% {t('availableOf')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-[var(--radius-card)] bg-[var(--color-light-green-100)] p-4 border border-[var(--color-light-green)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-mid-gray)]">{t('copiesOnLoan')}</span>
                <Layers3 className="w-5 h-5 text-[var(--color-heading)]" />
              </div>
              <div className="font-display text-3xl font-semibold text-[var(--color-dark-gray)] mt-2">{onLoanCopies}</div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-mid-gray)]">{t('libraryStatus')}</span>
                <ClipboardList className="w-5 h-5 text-[var(--color-heading)]" />
              </div>
              <div className="font-display text-3xl font-semibold text-[var(--color-dark-gray)] mt-2">
                {overdueLoans.length > 0 ? t('attention') : t('healthy')}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--color-border-gray)] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-mid-gray)]">{t('stockCoverage')}</span>
              <span className="text-sm font-semibold text-[var(--color-heading)]">{availableCopies} {t('availableOf')} {totalCopies} {t('availableCopies')}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--color-light-gray)] mt-3">
              <div className="h-2 rounded-full bg-[var(--color-medium-green)]" style={{ width: `${Math.min(Math.max(availableRate, 0), 100)}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[var(--color-mid-gray)]">Priority</p>
              <h2 className="font-display text-xl font-semibold text-[var(--color-heading)] mt-2">{t('focusArea')}</h2>
            </div>
            <AlertTriangle className="w-6 h-6 text-[var(--color-status-red)]" />
          </div>
          <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--color-status-red-bg)] border border-[var(--color-status-red)]/30 p-4">
            <div className="text-sm font-semibold text-[var(--color-status-red)]">
              {overdueLoans.length > 0 ? t('overdueLoans', { count: overdueLoans.length }) : t('noOverdueLoans')}
            </div>
            <div className="text-xs text-[var(--color-mid-gray)] mt-2">
              {t('reviewReturnedDates')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
