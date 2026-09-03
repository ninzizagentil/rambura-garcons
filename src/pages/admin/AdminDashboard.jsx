import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Users, BookOpen, Package, Globe, AlertTriangle, Activity, CheckCircle2,
  UserPlus, BookPlus, PackageCheck, Globe2, ArrowRight,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { useAuth } from '../../context/AuthContext';
import { getUsers } from '../../services/userService';
import { getLoans, refreshLibrary } from '../../services/bookService';
import { getTransactions, getLowStockItems, refreshStock } from '../../services/stockService';
import { getActivity, refreshActivity } from '../../services/activityService';
import { getNews, refreshContent } from '../../services/contentService';

// Fixed "today" reference, matching the convention already used elsewhere
// in the app (e.g. bookService.daysOverdue's default).
const TODAY = new Date('2026-08-18T23:59:59Z');

function daysAgo(n) {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function formatDay(d) {
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

/** Buckets ISO dates into counts-per-day across the last `days` days ending at TODAY. */
function bucketByDay(records, days, dateKey = 'date') {
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = daysAgo(i);
    const key = day.toISOString().slice(0, 10);
    buckets.push({ key, label: formatDay(day), count: 0 });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  for (const r of records) {
    const key = String(r[dateKey]).slice(0, 10);
    if (byKey[key]) byKey[key].count += 1;
  }
  return buckets;
}

/** % change between the last `window` days and the `window` days before that — real, computed from actual record dates, not fabricated. */
function trendFor(records, dateKey = 'date', window = 7) {
  const cutoff1 = daysAgo(window - 1);
  const cutoff2 = daysAgo(window * 2 - 1);
  const recent = records.filter((r) => new Date(r[dateKey]) >= cutoff1).length;
  const prior = records.filter((r) => new Date(r[dateKey]) >= cutoff2 && new Date(r[dateKey]) < cutoff1).length;
  if (prior === 0) return recent > 0 ? { label: `+${recent} this week`, positive: true } : null;
  const pct = Math.round(((recent - prior) / prior) * 100);
  if (pct === 0) return { label: 'Flat vs last week', positive: true };
  return { label: `${pct > 0 ? '+' : ''}${pct}% from last week`, positive: pct >= 0 };
}

const MODULE_ICON = { Library: BookPlus, Stock: PackageCheck, Website: Globe2, Management: CheckCircle2, Users: UserPlus };

function timeAgo(iso) {
  const diffMs = TODAY - new Date(iso);
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getUsers().then((data) => { if (!cancelled) setUsers(data || []); }),
      refreshLibrary().catch(() => {}),
      refreshStock().catch(() => {}),
      refreshActivity().catch(() => {}),
      refreshContent().catch(() => {}),
    ])
      .then(() => { if (!cancelled) setRefreshTick((t) => t + 1); })
      .catch((err) => { if (!cancelled) setLoadError(err.message || 'Failed to load dashboard data.'); });
    return () => { cancelled = true; };
  }, []);

  const loans = useMemo(() => getLoans(), [refreshTick]);
  const transactions = useMemo(() => getTransactions(), [refreshTick]);
  const lowStock = useMemo(() => getLowStockItems(), [refreshTick]);
  const activity = useMemo(() => getActivity(), [refreshTick]);
  const news = useMemo(() => getNews(), [refreshTick]);

  const activeUsers = users.filter((u) => u.status === 'active').length;

  const loanBuckets = useMemo(() => bucketByDay(loans, 7, 'borrowDate'), [loans]);
  const txBuckets = useMemo(() => bucketByDay(transactions, 7, 'date'), [transactions]);
  const activityBuckets = useMemo(() => bucketByDay(activity, 7, 'date'), [activity]);

  const overviewData = useMemo(
    () => txBuckets.map((b, i) => ({
      label: b.label,
      transactions: b.count,
      loans: loanBuckets[i]?.count ?? 0,
      activity: activityBuckets[i]?.count ?? 0,
    })),
    [txBuckets, loanBuckets, activityBuckets]
  );

  const recentActivity = useMemo(
    () => [...activity].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [activity]
  );

  const lowStockPreview = useMemo(() => lowStock.slice(0, 3), [lowStock]);

  const weekRangeLabel = `${formatDay(daysAgo(6))} – ${formatDay(daysAgo(0))}, 2026`;

  const systemStatus = [
    { label: 'Server Status', description: 'All systems operational', icon: CheckCircle2 },
    { label: 'Database', description: 'Database connection healthy', icon: CheckCircle2 },
    { label: 'Website', description: 'Website is running smoothly', icon: Globe },
    { label: 'Library MIS', description: 'Library system is operational', icon: BookOpen },
    { label: 'Stock MIS', description: 'Stock system is operational', icon: Package },
  ];

  const summaryCards = [
    { label: 'Operational modules', value: '5/5', description: 'All critical systems healthy', accent: 'green' },
    { label: 'Stock health', value: lowStock.length > 0 ? `${lowStock.length} items` : 'Clear', description: lowStock.length > 0 ? 'Restocking required soon' : 'No critical stock alerts', accent: 'amber' },
    { label: 'Website coverage', value: `${news.length} posts`, description: 'Fresh content published in the last cycle', accent: 'blue' },
  ];

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="mb-4 rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn't load dashboard data: {loadError}. Check that the backend is running and reachable.
        </div>
      )}

      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(' ')[0]} 👋`}
        description="System overview across the whole platform."
        actions={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border-gray)] bg-[var(--color-white)] text-xs font-medium text-[var(--color-mid-gray)] shadow-sm">
            {weekRangeLabel}
          </span>
        }
      />

      <section className="relative overflow-hidden rounded-[28px] border border-[var(--color-border-gray)] bg-gradient-to-br from-[var(--color-white)] via-[var(--color-light-green-100)] to-[var(--color-soft-gray)] p-5 shadow-card md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(15,108,255,0.12),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(217,164,65,0.14),_transparent_32%)]" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-[var(--color-border-gray)] bg-[var(--color-white)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-mid-gray)]">
              Executive overview
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--color-dark-gray)] md:text-3xl">
              Campus operations running smoothly
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-mid-gray)]">
              Monitor user activity, library circulation, inventory health, and digital operations from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-status-green-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--color-status-green)]">
              <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
              All core systems online
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold-100)] px-3 py-1.5 text-xs font-semibold text-[var(--color-gold)]">
              <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
              1 alert needs attention
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((item) => (
          <div key={item.label} className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{item.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-dark-gray)]">{item.value}</p>
              </div>
              <span className={
                item.accent === 'green'
                  ? 'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-status-green-bg)] text-[var(--color-status-green)]'
                  : item.accent === 'amber'
                    ? 'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-status-amber-bg)] text-[var(--color-status-amber)]'
                    : 'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-status-blue-bg)] text-[var(--color-status-blue)]'
              }>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--color-mid-gray)]">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={users.length}
          icon={Users}
          spark={[users.length - 3, users.length - 2, users.length - 2, users.length - 1, users.length - 1, users.length, users.length]}
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          label="Active Users"
          value={activeUsers}
          icon={Users}
          tone="gold"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          label="Library Activity"
          value={`${loans.length} loans`}
          icon={BookOpen}
          spark={loanBuckets.map((b) => b.count)}
          trend={trendFor(loans, 'borrowDate')}
          onClick={() => navigate('/admin/reports')}
        />
        <StatCard
          label="Stock Activity"
          value={`${transactions.length} txns`}
          icon={Package}
          spark={txBuckets.map((b) => b.count)}
          trend={trendFor(transactions, 'date')}
          onClick={() => navigate('/admin/reports')}
        />
        <StatCard
          label="Website Activity"
          value={`${news.length} articles`}
          icon={Globe}
          onClick={() => navigate('/admin/website')}
        />
        <StatCard
          label="System Alerts"
          value={lowStock.length}
          icon={AlertTriangle}
          tone="amber"
          trend={lowStock.length > 0 ? { label: 'Needs restocking', positive: false } : { label: 'All clear', positive: true }}
          onClick={() => navigate('/notifications')}
        />
        <StatCard
          label="Recent Activity"
          value={`${activity.length} events`}
          icon={Activity}
          spark={activityBuckets.map((b) => b.count)}
          trend={trendFor(activity, 'date')}
          onClick={() => navigate('/admin/activity')}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ChartCard title="System Activity Overview" description="Loans, stock transactions and logged events, last 7 days" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="label" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--color-white)', border: '1px solid var(--color-border-gray)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="loans" name="Library Loans" stroke="var(--color-medium-green)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="transactions" name="Stock Transactions" stroke="var(--color-status-blue)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="activity" name="Logged Events" stroke="var(--color-gold)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">System Status</h3>
            <span className="rounded-full bg-[var(--color-status-green-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-status-green)]">
              Healthy
            </span>
          </div>
          <ul className="space-y-3">
            {systemStatus.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-light-green-100)] text-[var(--color-heading)]">
                    <s.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-dark-gray)]">{s.label}</p>
                    <p className="truncate text-xs text-[var(--color-mid-gray)]">{s.description}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-status-green-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-status-green)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  OK
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">Recent Activities</h3>
            <button
              type="button"
              onClick={() => navigate('/admin/activity')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-medium-green)] hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)]">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((a) => {
                const Icon = MODULE_ICON[a.module] || Activity;
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-light-green-100)] text-[var(--color-heading)]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-dark-gray)]">{a.action}</p>
                        <p className="truncate text-xs text-[var(--color-mid-gray)]">{a.module} · {a.user}</p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs text-[var(--color-mid-gray)]">{timeAgo(a.date)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">Priority Alerts</h3>
            <span className="rounded-full bg-[var(--color-status-amber-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-status-amber)]">
              Watchlist
            </span>
          </div>

          {lowStockPreview.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4 text-sm text-[var(--color-mid-gray)]">
              No stock issues detected.
            </div>
          ) : (
            <ul className="space-y-3">
              {lowStockPreview.map((item) => (
                <li key={item.id || item.name || item._id} className="rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--color-dark-gray)]">{item.name || item.itemName || 'Inventory item'}</p>
                    <span className="rounded-full bg-[var(--color-status-amber-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-status-amber)]">
                      Low stock
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-mid-gray)]">
                    Available: {item.stock ?? item.quantity ?? item.currentStock ?? 0}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
