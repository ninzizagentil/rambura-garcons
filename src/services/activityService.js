import { loadCollection, saveCollection, genId } from '../utils/storage';

const ACTIVITY_KEY = 'rg_activity';

const SEED_ACTIVITY = [
  { id: 'a1', user: 'Marie Claire Uwase', action: 'Added book "Applied Electricity Vol. 2"', module: 'Library', date: '2026-08-17T09:12:00Z', status: 'success' },
  { id: 'a2', user: 'Emmanuel Nshuti', action: 'Recorded Stock In: Rice (+40kg)', module: 'Stock', date: '2026-08-17T10:40:00Z', status: 'success' },
  { id: 'a3', user: 'Jean de Dieu Habimana', action: 'Updated website homepage banner', module: 'Website', date: '2026-08-16T14:02:00Z', status: 'success' },
  { id: 'a4', user: 'Marie Claire Uwase', action: 'Marked loan overdue: "Welding Fundamentals"', module: 'Library', date: '2026-08-16T08:30:00Z', status: 'warning' },
  { id: 'a5', user: 'Bro. Alphonse Ntawuruhunga', action: 'Viewed Stock Reports', module: 'Management', date: '2026-08-15T16:55:00Z', status: 'success' },
];

export function getActivity() {
  return loadCollection(ACTIVITY_KEY, SEED_ACTIVITY);
}

export function logActivity({ user, action, module, status = 'success' }) {
  const activity = loadCollection(ACTIVITY_KEY, SEED_ACTIVITY);
  const entry = { id: genId('a'), user, action, module, status, date: new Date().toISOString() };
  saveCollection(ACTIVITY_KEY, [entry, ...activity]);
  return entry;
}
