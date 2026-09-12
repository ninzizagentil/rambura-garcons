import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/feedback/States';
import { deleteContactMessage, getContactMessages } from '../../services/contactMessageService';

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const removeMessage = async (id) => {
    if (!window.confirm('Delete this contact message? This cannot be undone.')) return;
    await deleteContactMessage(id);
    setMessages((current) => current.filter((message) => message._id !== id));
  };

  useEffect(() => {
    getContactMessages().then(setMessages).catch(() => setMessages([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Contact Messages"
        description="Messages submitted by visitors through the public Contact Us form."
        breadcrumb={[{ label: 'School Management', to: '/management' }, { label: 'Contact Messages' }]}
      />
      {loading ? (
        <p className="p-8 text-sm text-[var(--color-mid-gray)]">Loading messages...</p>
      ) : messages.length === 0 ? (
        <EmptyState title="No contact messages yet" message="New messages from the public Contact Us form will appear here." />
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <article key={message._id} className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{message.subject}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{message.name} · {message.email}</p>
                </div>
                  <div className="flex items-center gap-3">
                    <time className="text-xs text-[var(--text-secondary)]" dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('en-GB')}</time>
                    <button type="button" onClick={() => removeMessage(message._id)} className="text-xs font-semibold text-[var(--color-status-red)] hover:underline">Delete</button>
                  </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">{message.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
