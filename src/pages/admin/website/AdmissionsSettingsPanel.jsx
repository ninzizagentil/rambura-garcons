import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input, Textarea } from '../../../components/forms/FormField';
import Button from '../../../components/common/Button';
import IconButton from '../../../components/common/IconButton';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useApp } from '../../../context/AppContext';
import { getAdmissionsSettings, updateAdmissionsSettings } from '../../../services/contentService';

export default function AdmissionsSettingsPanel() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useApp();
  const [form, setForm] = useState(getAdmissionsSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(getAdmissionsSettings());
  }, []);

  const updateRequirement = (i, value) =>
    setForm((f) => ({ ...f, requirements: f.requirements.map((r, idx) => (idx === i ? value : r)) }));
  const addRequirement = () => setForm((f) => ({ ...f, requirements: [...f.requirements, ''] }));
  const removeRequirement = (i) => setForm((f) => ({ ...f, requirements: f.requirements.filter((_, idx) => idx !== i) }));

  const updateDate = (i, key, value) =>
    setForm((f) => ({ ...f, dates: f.dates.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)) }));
  const addDate = () => setForm((f) => ({ ...f, dates: [...f.dates, { label: '', value: '' }] }));
  const removeDate = (i) => setForm((f) => ({ ...f, dates: f.dates.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    setSaving(true);
    const cleaned = {
      ...form,
      requirements: form.requirements.map((r) => r.trim()).filter(Boolean),
      dates: form.dates.filter((d) => d.label.trim() && d.value.trim()),
    };
    const result = await updateAdmissionsSettings(cleaned, user?.fullName || 'System Administrator');
    if (result.success) { setForm(cleaned); showToast(t('admissionsUpdated'), 'success'); }
    else showToast(result.error, 'error');
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-8">
      <p className="text-sm text-[var(--color-mid-gray)]">
        {t('liveAdmissionsContent')}
      </p>

      <div>
        <p className="text-sm font-semibold text-[var(--color-dark-gray)] mb-3">{t('requirements')}</p>
        <div className="space-y-2">
          {form.requirements.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={r} onChange={(e) => updateRequirement(i, e.target.value)} className="flex-1" />
              <IconButton icon={Trash2} label={t('removeRequirement')} variant="danger" onClick={() => removeRequirement(i)} />
            </div>
          ))}
        </div>
        <Button variant="ghost" icon={Plus} onClick={addRequirement} className="mt-2">{t('addRequirement')}</Button>
      </div>

      <div>
        <p className="text-sm font-semibold text-[var(--color-dark-gray)] mb-3">{t('importantDates')}</p>
        <div className="space-y-2">
          {form.dates.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input placeholder={t('dateLabelPlaceholder')} value={d.label} onChange={(e) => updateDate(i, 'label', e.target.value)} className="flex-1" />
              <Input placeholder={t('dateValuePlaceholder')} value={d.value} onChange={(e) => updateDate(i, 'value', e.target.value)} className="flex-1" />
              <IconButton icon={Trash2} label={t('removeDate')} variant="danger" onClick={() => removeDate(i)} />
            </div>
          ))}
        </div>
        <Button variant="ghost" icon={Plus} onClick={addDate} className="mt-2">{t('addDate')}</Button>
      </div>

      <Textarea
        label={t('admissionProcess')}
        rows={3}
        value={form.process}
        onChange={(e) => setForm((f) => ({ ...f, process: e.target.value }))}
      />
      <Input
        label={t('contactLine')}
        value={form.contactLine}
        onChange={(e) => setForm((f) => ({ ...f, contactLine: e.target.value }))}
        hint={t('admissionsContactHint')}
      />

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} loading={saving}>{t('saveChanges')}</Button>
      </div>
    </div>
  );
}
