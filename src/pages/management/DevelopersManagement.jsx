import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { Input, Textarea } from '../../components/forms/FormField';
import { Plus, Save, Trash2 } from 'lucide-react';
import { getDevelopersPage, updateDevelopersPage } from '../../services/contentService';
import { useToast } from '../../context/ToastContext';

export default function DevelopersManagement() {
  const [form, setForm] = useState(getDevelopersPage());
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const update = (changes) => setForm((current) => ({ ...current, ...changes }));
  const updateDeveloper = (index, changes) => update({ developers: form.developers.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) });
  const updateCapability = (index, changes) => update({ capabilities: form.capabilities.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) });
  const addDeveloper = () => update({ developers: [...form.developers, { name: '', role: '' }] });
  const removeDeveloper = (index) => update({ developers: form.developers.filter((_, itemIndex) => itemIndex !== index) });

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    const result = await updateDevelopersPage(form);
    setSaving(false);
    showToast(result.success ? 'Developers page saved.' : result.error, result.success ? 'success' : 'error');
    if (result.success) setForm(getDevelopersPage());
  };

  return (
    <div>
      <PageHeader title="Developers Page" description="Manage the developer information shown on the public Developers page." breadcrumb={[{ label: 'School Management', to: '/management' }, { label: 'Developers Page' }]} />
      <form onSubmit={save} className="max-w-5xl space-y-8">
        <section className="rounded-2xl border border-[var(--color-gold)]/30 bg-[linear-gradient(135deg,var(--color-soft-gray),rgba(185,130,45,0.06))] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-gold)]">Public page content</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-[var(--text-primary)]">Developers page</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">Update the page linked from the public website footer.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">Page introduction</h2>
          <div className="grid gap-4 sm:grid-cols-2"><Input label="Page title" required value={form.title} onChange={(e) => update({ title: e.target.value })} /><Input label="Team label" required value={form.teamLabel} onChange={(e) => update({ teamLabel: e.target.value })} /></div>
          <Textarea label="Page introduction" required rows={2} value={form.intro} onChange={(e) => update({ intro: e.target.value })} />
          <Input label="Main heading" required value={form.heading} onChange={(e) => update({ heading: e.target.value })} />
          <Textarea label="Main description" required rows={3} value={form.description} onChange={(e) => update({ description: e.target.value })} />
        </section>
        <section className="space-y-4 border-t border-[var(--border)] pt-7">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-base font-semibold text-[var(--text-primary)]">Development team</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">Add another developer or remove an existing entry.</p></div><Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addDeveloper}>Add Developer</Button></div>
          {form.developers.map((developer, index) => <div key={index} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--color-soft-gray)] p-4 sm:grid-cols-[auto_1fr_1fr_auto] items-end"><span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-deep-green)] text-sm font-bold text-[var(--color-gold)]">{index + 1}</span><Input label={`Developer ${index + 1} name`} required value={developer.name} onChange={(e) => updateDeveloper(index, { name: e.target.value })} /><Input label="Role" required value={developer.role} onChange={(e) => updateDeveloper(index, { role: e.target.value })} /><Button type="button" variant="ghost" size="sm" icon={Trash2} aria-label={`Remove developer ${index + 1}`} onClick={() => removeDeveloper(index)}>Remove</Button></div>)}
        </section>
        <section className="space-y-4 border-t border-[var(--border)] pt-7">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">What was built</h2>
          {form.capabilities.map((capability, index) => <div key={index} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--color-soft-gray)] p-4"><Input label={`Capability ${index + 1}`} required value={capability.label} onChange={(e) => updateCapability(index, { label: e.target.value })} /><Textarea label="Description" required rows={2} value={capability.detail} onChange={(e) => updateCapability(index, { detail: e.target.value })} /></div>)}
        </section>
        <div className="flex justify-end border-t border-[var(--border)] pt-6"><Button type="submit" variant="primary" icon={Save} loading={saving}>Save Developers Page</Button></div>
      </form>
    </div>
  );
}
