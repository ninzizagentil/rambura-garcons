import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { Input, Textarea } from '../../components/forms/FormField';
import ImageField from '../../components/forms/ImageField';
import { Globe, Plus, Save, Trash2 } from 'lucide-react';
import { getDevelopersPage, updateDevelopersPage } from '../../services/contentService';
import { useToast } from '../../context/ToastContext';

export default function DevelopersManagement() {
  const location = useLocation();
  const [form, setForm] = useState(getDevelopersPage());
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const isDeveloperPanel = location.pathname.startsWith('/developer');
  const breadcrumb = isDeveloperPanel
    ? [{ label: 'Developer Panel', to: '/developer' }, { label: 'Developers Page' }]
    : [{ label: 'School Management', to: '/management' }, { label: 'Developers Page' }];
  const update = (changes) => setForm((current) => ({ ...current, ...changes }));
  const updateDeveloper = (index, changes) => update({ developers: form.developers.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) });
  const addDeveloper = () => update({ developers: [...form.developers, { name: '', role: '', bio: '', skills: [], photo: '', socials: { facebook: '', instagram: '', whatsapp: '', twitter: '', github: '' } }] });
  const removeDeveloper = (index) => update({ developers: form.developers.filter((_, itemIndex) => itemIndex !== index) });
  const updateSocial = (index, platform, value) => updateDeveloper(index, { socials: { ...(form.developers[index].socials || {}), [platform]: value } });

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
      <PageHeader title="Developers Page" description="Manage the developer information shown on the public Developers page." breadcrumb={breadcrumb} />
      <form onSubmit={save} className="max-w-5xl space-y-8">
        <section className="space-y-4">
          <div><h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Developer profiles</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Manage the people shown on the public Developers page. Keep each profile focused and current.</p></div>
        </section>
        <section className="space-y-4 border-t border-[var(--border)] pt-7">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-base font-semibold text-[var(--text-primary)]">Development team</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">Each developer appears as an individual profile card on the public page.</p></div><Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addDeveloper}>Add Developer</Button></div>
          <div className="grid gap-5 lg:grid-cols-2">
            {form.developers.map((developer, index) => {
              const socials = developer.socials || {};
              return (
                <article key={index} className="relative rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_12px_30px_rgba(23,59,49,0.1)] transition-colors md:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-gold)] text-[11px] font-bold text-[var(--color-deep-green)]">{index + 1}</span>
                      <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Developer {index + 1}</h3>
                    </div>
                    <Button type="button" variant="ghost" size="sm" icon={Trash2} aria-label={`Remove developer ${index + 1}`} onClick={() => removeDeveloper(index)}>Remove</Button>
                  </div>
                  <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)] p-3">
                      <ImageField label="Profile picture" value={developer.photo || ''} onChange={(photo) => updateDeveloper(index, { photo })} hint="Use a clear headshot or professional portrait." maxDimension={800} preserveTransparency={false} />
                    </div>
                    <div className="space-y-4">
                      <Input label={`Developer ${index + 1} name`} required value={developer.name} onChange={(e) => updateDeveloper(index, { name: e.target.value })} className="h-12 text-base" />
                      <Input label="Role" required value={developer.role} onChange={(e) => updateDeveloper(index, { role: e.target.value })} className="h-12 text-base" />
                      <Textarea label="Short biography" value={developer.bio || ''} onChange={(e) => updateDeveloper(index, { bio: e.target.value })} placeholder="Describe this person's responsibility in one or two sentences." rows={3} />
                      <Input label="Skills or technologies" value={(developer.skills || []).join(', ')} onChange={(e) => updateDeveloper(index, { skills: e.target.value.split(',').map((skill) => skill.trim()).filter(Boolean) })} placeholder="e.g. React, APIs, UX" />
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-2 xl:grid-cols-5">
                    <Input label="Facebook" type="url" icon={Globe} value={socials.facebook || ''} onChange={(e) => updateSocial(index, 'facebook', e.target.value)} placeholder="https://facebook.com/..." className="h-11" />
                    <Input label="Instagram" type="url" icon={Globe} value={socials.instagram || ''} onChange={(e) => updateSocial(index, 'instagram', e.target.value)} placeholder="https://instagram.com/..." className="h-11" />
                    <Input label="WhatsApp" type="url" icon={Globe} value={socials.whatsapp || ''} onChange={(e) => updateSocial(index, 'whatsapp', e.target.value)} placeholder="https://wa.me/..." className="h-11" />
                    <Input label="Twitter" type="url" icon={Globe} value={socials.twitter || ''} onChange={(e) => updateSocial(index, 'twitter', e.target.value)} placeholder="https://x.com/..." className="h-11" />
                    <Input label="GitHub" type="url" icon={Globe} value={socials.github || ''} onChange={(e) => updateSocial(index, 'github', e.target.value)} placeholder="https://github.com/..." className="h-11" />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <div className="flex justify-end border-t border-[var(--border)] pt-6"><Button type="submit" variant="primary" icon={Save} loading={saving}>Save Developers Page</Button></div>
      </form>
    </div>
  );
}
