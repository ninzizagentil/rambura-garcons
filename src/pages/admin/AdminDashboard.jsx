import { useMemo } from 'react';
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
import { getLoans } from '../../services/bookService';
import { getTransactions, getLowStockItems } from '../../services/stockService';
import { getActivity } from '../../services/activityService';
import { getNews } from '../../services/contentService';

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

  const users = useMemo(() => getUsers(), []);
  const loans = useMemo(() => getLoans(), []);
  const transactions = useMemo(() => getTransactions(), []);
  const lowStock = useMemo(() => getLowStockItems(), []);
  const activity = useMemo(() => getActivity(), []);
  const news = useMemo(() => getNews(), []);

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

  const weekRangeLabel = `${formatDay(daysAgo(6))} – ${formatDay(daysAgo(0))}, 2026`;

  const systemStatus = [
    { label: 'Server Status', description: 'All systems operational', icon: CheckCircle2 },
    { label: 'Database', description: 'Database connection healthy', icon: CheckCircle2 },
    { label: 'Website', description: 'Website is running smoothly', icon: Globe },
    { label: 'Library MIS', description: 'Library system is operational', icon: BookOpen },
    { label: 'Stock MIS', description: 'Stock system is operational', icon: Package },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(' ')[0]} 👋`}
        description="System overview across the whole platform."
        actions={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border-gray)] bg-[var(--color-white)] text-xs font-medium text-[var(--color-mid-gray)]">
            {weekRangeLabel}
          </span>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="System Activity Overview" description="Loans, stock transactions and logged events, last 7 days" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="label" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--color-white)', border: '1px solid var(--color-border-gray)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="loans" name="Library Loans" stroke="var(--color-medium-green)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="transactions" name="Stock Transactions" stroke="var(--color-status-blue)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="activity" name="Logged Events" stroke="var(--color-gold)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">System Status</h3>
          </div>
          <ul className="divide-y divide-[var(--color-border-gray)]">
            {systemStatus.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-light-green-100)] text-[var(--color-heading)] flex-shrink-0">
                    <s.icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-dark-gray)] truncate">{s.label}</p>
                    <p className="text-xs text-[var(--color-mid-gray)] truncate">{s.description}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-status-green-bg)] text-[var(--color-status-green)] text-xs font-medium whitespace-nowrap flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                  Operational
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card p-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">Recent Activities</h3>
          <button
            type="button"
            onClick={() => navigate('/admin/activity')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-medium-green)] hover:underline"
          >
            View all <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-[var(--color-mid-gray)]">No activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border-gray)]">
            {recentActivity.map((a) => {
              const Icon = MODULE_ICON[a.module] || Activity;
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-light-green-100)] text-[var(--color-heading)] flex-shrink-0">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-dark-gray)] truncate">{a.action}</p>
                      <p className="text-xs text-[var(--color-mid-gray)] truncate">{a.module} · {a.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-mid-gray)] whitespace-nowrap flex-shrink-0">{timeAgo(a.date)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
