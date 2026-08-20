import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import { getLoans } from '../../services/bookService';

export default function BorrowingHistory() {
  const { showToast } = useToast();
  const [loans] = useState(getLoans());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return loans.filter((l) => {
      const matchesSearch = !search || l.bookTitle.toLowerCase().includes(search.toLowerCase()) || l.borrower.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [loans, search, statusFilter]);

  const columns = [
    { key: 'borrower', header: 'Borrower' },
    { key: 'bookTitle', header: 'Book' },
    { key: 'borrowDate', header: 'Borrowed' },
    { key: 'dueDate', header: 'Due' },
    { key: 'returnDate', header: 'Returned', render: (l) => l.returnDate || '—' },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Borrowing History"
        description="Complete record of all loans."
        breadcrumb={[{ label: 'Library', to: '/library' }, { label: 'Borrowing History' }]}
        actions={<Button variant="secondary" icon={Download} onClick={() => showToast('History exported (demo).', 'success')}>Export</Button>}
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by borrower or book…" className="flex-1 min-w-[220px]" />
        <FilterDropdown
          label="All Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'borrowed', label: 'Borrowed' }, { value: 'returned', label: 'Returned' }, { value: 'overdue', label: 'Overdue' }]}
        />
      </div>
      <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable columns={columns} data={filtered} emptyState={<EmptyState title="No history found" message="Try a different search or filter." />} />
      </div>
    </div>
  );
}
