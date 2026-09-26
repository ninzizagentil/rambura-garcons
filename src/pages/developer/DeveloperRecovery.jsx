import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { createDeveloperBackup, listDeveloperBackups, restoreDeveloperBackup } from '../../services/developerService';
import { api } from '../../services/api';

export default function DeveloperRecovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'backups';
  const [backups, setBackups] = useState([]);
  const [history, setHistory] = useState([]);

  const loadData = async () => {
    const [backupData, activityData] = await Promise.all([
      listDeveloperBackups(),
      api.get('/developer/activity').then((result) => result.data).catch(() => []),
    ]);
    setBackups(backupData);
    setHistory(activityData.filter((item) => /backup|restore|recover/i.test(item.action || '')));
  };

  useEffect(() => { loadData(); }, []);

  const createBackup = async () => {
    const result = await createDeveloperBackup();
    if (result) loadData();
  };

  const restoreBackup = async (fileName) => {
    const confirmed = window.confirm('Restoring a backup may replace current system data. Continue?');
    if (!confirmed) return;
    await restoreDeveloperBackup(fileName);
    loadData();
  };

  const tabButton = (name, label) => (
    <button type="button" key={name} onClick={() => setSearchParams({ tab: name })} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === name ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-off-white)] text-[var(--color-mid-gray)]'}`}>
      {label}
    </button>
  );

  return (
    <div>
      <PageHeader title="System Recovery" description="Create, review and restore device-safe backups and recovery history." breadcrumb={[{ label: 'Developer Panel', to: '/developer' }, { label: 'System Recovery' }]} />
      <div className="mb-4 flex gap-2">{tabButton('backups', 'Backups')}{tabButton('restore', 'Restore')}{tabButton('history', 'Recovery History')}</div>

      {tab === 'backups' && (
        <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--color-dark-gray)]">Available backups</h3>
            <Button type="button" onClick={createBackup}>Create Backup</Button>
          </div>
          <div className="space-y-3">
            {backups.length ? backups.map((backup) => (
              <div key={backup.name} className="flex items-center justify-between rounded-lg border border-[var(--color-border-gray)] p-3">
                <div>
                  <p className="font-medium text-[var(--color-dark-gray)]">{backup.name}</p>
                  <p className="text-xs text-[var(--color-mid-gray)]">{backup.path}</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => restoreBackup(backup.name)}>Restore</Button>
              </div>
            )) : <p className="text-sm text-[var(--color-mid-gray)]">No backups created yet.</p>}
          </div>
        </div>
      )}

      {tab === 'restore' && (
        <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <p className="text-sm leading-6 text-[var(--color-mid-gray)]">Restoring a backup may replace current system data. Confirm the selected backup before proceeding.</p>
          {backups.length ? (
            <div className="mt-4 space-y-3">
              {backups.map((backup) => (
                <div key={backup.name} className="flex items-center justify-between rounded-lg border border-[var(--color-border-gray)] p-3">
                  <span className="font-medium text-[var(--color-dark-gray)]">{backup.name}</span>
                  <Button type="button" onClick={() => restoreBackup(backup.name)}>Confirm restore</Button>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-[var(--color-mid-gray)]">No backup selected.</p>}
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-[20px] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <div className="space-y-3">
            {history.length ? history.map((entry, index) => (
              <div key={`${entry.action}-${index}`} className="rounded-lg border border-[var(--color-border-gray)] p-3">
                <p className="font-medium text-[var(--color-dark-gray)]">{entry.action}</p>
                <p className="text-sm text-[var(--color-mid-gray)]">{new Date(entry.createdAt).toLocaleString()}</p>
                <p className="text-sm text-[var(--color-mid-gray)]">Result: {entry.status || 'successful'}</p>
              </div>
            )) : <p className="text-sm text-[var(--color-mid-gray)]">No recovery activity yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
