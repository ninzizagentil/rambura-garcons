import { useEffect, useMemo, useState } from 'react';
import {
  Mail, MailOpen, Trash2, CheckCheck, MailCheck, Inbox,
  Search, User, Clock, ChevronRight, AlertTriangle,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import {
  getContactMessages,
  deleteContactMessage,
  markMessageRead,
  bulkMarkRead,
  bulkDeleteMessages,
} from '../../services/contactMessageService';

const FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read',   label: 'Read' },
];
/* oxlint-disable react/set-state-in-effect -- selected messages mirror their server read status. */

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: diffDays > 365 ? 'numeric' : undefined });
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border-gray)] bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-[var(--color-dark-gray)] leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--color-border-gray)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-dark-gray)] hover:bg-[var(--color-off-white)] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContactMessages() {
  const [messages, setMessages]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [busy, setBusy]             = useState(false);
  const [confirm, setConfirm]       = useState(null); // { message, onConfirm }
  const { showToast } = useToast();

  const load = async () => {
    try {
      const data = await getContactMessages();
      setMessages(data);
    } catch {
      showToast('Failed to load messages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-mark selected message as read
  // This effect mirrors the selected server record after it is marked read.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    if (!selected) return;
    if (selected.status === 'read') return;
    markMessageRead(selected._id)
      .then(() => {
        // oxlint-disable-next-line react(set-state-in-effect)
        setMessages((prev) =>
          prev.map((m) => m._id === selected._id ? { ...m, status: 'read' } : m)
        );
        setSelected((s) => s ? { ...s, status: 'read' } : s);
      })
      .catch(() => {}); // silent — not critical
  }, [selected?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = messages;
    if (filter === 'unread') list = list.filter((m) => m.status !== 'read');
    if (filter === 'read')   list = list.filter((m) => m.status === 'read');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.subject || '').toLowerCase().includes(q) ||
        (m.message || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, filter, search]);

  const counts = useMemo(() => ({
    all:    messages.length,
    unread: messages.filter((m) => m.status !== 'read').length,
    read:   messages.filter((m) => m.status === 'read').length,
  }), [messages]);

  // ── Single delete ────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    setConfirm({
      message: 'Delete this message? This cannot be undone.',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteContactMessage(id);
          setMessages((prev) => prev.filter((m) => m._id !== id));
          if (selected?._id === id) setSelected(null);
          showToast('Message deleted.', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  // ── Bulk: Mark all read ───────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (counts.unread === 0) { showToast('All messages are already read.', 'info'); return; }
    setBusy(true);
    try {
      await bulkMarkRead('unread');
      setMessages((prev) => prev.map((m) => ({ ...m, status: 'read' })));
      if (selected) setSelected((s) => s ? { ...s, status: 'read' } : s);
      showToast(`${counts.unread} message${counts.unread !== 1 ? 's' : ''} marked as read.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // ── Bulk: Delete read ─────────────────────────────────────────────────────────
  const handleDeleteRead = () => {
    if (counts.read === 0) { showToast('No read messages to delete.', 'info'); return; }
    setConfirm({
      message: `Delete all ${counts.read} read message${counts.read !== 1 ? 's' : ''}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        setBusy(true);
        try {
          await bulkDeleteMessages('read');
          setMessages((prev) => prev.filter((m) => m.status !== 'read'));
          if (selected?.status === 'read') setSelected(null);
          showToast('Read messages deleted.', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  // ── Bulk: Delete all ──────────────────────────────────────────────────────────
  const handleDeleteAll = () => {
    if (messages.length === 0) { showToast('No messages to delete.', 'info'); return; }
    setConfirm({
      message: `Delete all ${messages.length} message${messages.length !== 1 ? 's' : ''}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        setBusy(true);
        try {
          await bulkDeleteMessages('all');
          setMessages([]);
          setSelected(null);
          showToast('All messages deleted.', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  return (
    <>
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex flex-col h-full">
        <PageHeader
          title="Messages"
          description="Messages submitted by visitors through the public Contact Us form."
          breadcrumb={[{ label: 'School Management', to: '/management' }, { label: 'Messages' }]}
          actions={
            /* ── 3 bulk action buttons ── */
            <div className="flex flex-wrap items-center gap-2">
              {/* Mark all read */}
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={busy || counts.unread === 0}
                title="Mark all unread messages as read"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-gray)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-dark-gray)] shadow-sm transition hover:border-[var(--color-medium-green)] hover:text-[var(--color-medium-green)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MailCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Mark all read
                {counts.unread > 0 && (
                  <span className="ml-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    {counts.unread}
                  </span>
                )}
              </button>

              {/* Delete read */}
              <button
                type="button"
                onClick={handleDeleteRead}
                disabled={busy || counts.read === 0}
                title="Delete all read messages"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-gray)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-dark-gray)] shadow-sm transition hover:border-red-300 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Delete read
                {counts.read > 0 && (
                  <span className="ml-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                    {counts.read}
                  </span>
                )}
              </button>

              {/* Delete all */}
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={busy || messages.length === 0}
                title="Delete all messages"
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Delete all
              </button>
            </div>
          }
        />

        {/* ── Search + filter tabs ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="h-9 w-full rounded-lg border border-[var(--color-border-gray)] bg-white pl-9 pr-3 text-sm text-[var(--color-dark-gray)] placeholder:text-[var(--color-mid-gray)] focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)]/30 transition"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border-gray)] bg-white p-1">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  filter === key
                    ? 'bg-[var(--color-medium-green)] text-white shadow-sm'
                    : 'text-[var(--color-dark-gray)] hover:bg-[var(--color-off-white)]'
                }`}
              >
                {label}
                {counts[key] > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    filter === key ? 'bg-white/25 text-white' : 'bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)]'
                  }`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Split pane ── */}
        {loading ? (
          <p className="p-8 text-sm text-[var(--color-mid-gray)]">Loading messages…</p>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No messages yet"
            message="New messages from the public Contact Us form will appear here."
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-0 flex-1 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-white shadow-sm min-h-[520px]">

            {/* ── Left: message list ── */}
            <div className={`lg:w-80 xl:w-96 shrink-0 flex flex-col border-r border-[var(--color-border-gray)] overflow-hidden ${selected ? 'hidden lg:flex' : 'flex'}`}>
              {filtered.length === 0 ? (
                <p className="p-6 text-sm text-[var(--color-mid-gray)] text-center">No messages match this filter.</p>
              ) : (
                <ul className="flex-1 overflow-y-auto divide-y divide-[var(--color-border-gray)]">
                  {filtered.map((msg) => {
                    const isUnread = msg.status !== 'read';
                    const isActive = selected?._id === msg._id;
                    return (
                      <li key={msg._id}>
                        <button
                          type="button"
                          onClick={() => setSelected(msg)}
                          className={`w-full text-left px-4 py-3.5 transition group ${
                            isActive
                              ? 'bg-[var(--color-medium-green)] text-white'
                              : 'hover:bg-[var(--color-off-white)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className={`flex items-center gap-1.5 text-xs font-bold truncate ${isActive ? 'text-white' : 'text-[var(--color-dark-gray)]'}`}>
                              {isUnread && !isActive && (
                                <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-medium-green)] shrink-0" aria-label="Unread" />
                              )}
                              {msg.name}
                            </span>
                            <span className={`text-[10px] shrink-0 ${isActive ? 'text-white/70' : 'text-[var(--color-mid-gray)]'}`}>
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                          <p className={`text-xs font-semibold truncate mb-0.5 ${isActive ? 'text-white/90' : isUnread ? 'text-[var(--color-dark-gray)]' : 'text-[var(--color-mid-gray)]'}`}>
                            {msg.subject}
                          </p>
                          <p className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-[var(--color-mid-gray)]'}`}>
                            {msg.message}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              isActive
                                ? 'bg-white/20 text-white border-white/30'
                                : isUnread
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)] border-[var(--color-border-gray)]'
                            }`}>
                              {isUnread
                                ? <><Mail className="w-2.5 h-2.5" aria-hidden="true" /> Unread</>
                                : <><MailOpen className="w-2.5 h-2.5" aria-hidden="true" /> Read</>
                              }
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* ── Right: message detail ── */}
            <div className={`flex-1 flex flex-col overflow-hidden ${selected ? 'flex' : 'hidden lg:flex'}`}>
              {selected ? (
                <div className="flex flex-col h-full">
                  {/* Detail header */}
                  <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border-gray)] px-5 py-4">
                    <div className="min-w-0">
                      {/* Back button — mobile only */}
                      <button
                        type="button"
                        onClick={() => setSelected(null)}
                        className="lg:hidden mb-2 flex items-center gap-1 text-xs font-semibold text-[var(--color-medium-green)] hover:underline"
                      >
                        ← Back to messages
                      </button>
                      <h2 className="font-display text-base font-bold text-[var(--color-dark-gray)] leading-snug">
                        {selected.subject}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-mid-gray)]">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" aria-hidden="true" />
                          <span className="font-semibold text-[var(--color-dark-gray)]">{selected.name}</span>
                        </span>
                        <span>·</span>
                        <a href={`mailto:${selected.email}`} className="text-[var(--color-medium-green)] hover:underline">
                          {selected.email}
                        </a>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {new Date(selected.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                        selected.status !== 'read'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)] border-[var(--color-border-gray)]'
                      }`}>
                        {selected.status !== 'read'
                          ? <><Mail className="w-3 h-3" aria-hidden="true" /> Unread</>
                          : <><MailOpen className="w-3 h-3" aria-hidden="true" /> Read</>
                        }
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(selected._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-100 transition"
                        aria-label="Delete this message"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="flex-1 overflow-y-auto px-5 py-5">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-dark-gray)]">
                      {selected.message}
                    </p>
                  </div>

                  {/* Quick reply link */}
                  <div className="border-t border-[var(--color-border-gray)] px-5 py-3">
                    <a
                      href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-medium-green)] hover:underline"
                    >
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      Reply via email
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                  <MailOpen className="w-10 h-10 text-[var(--color-border-gray)]" aria-hidden="true" />
                  <p className="text-sm text-[var(--color-mid-gray)]">Select a message to read it</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
