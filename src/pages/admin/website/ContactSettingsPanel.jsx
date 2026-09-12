import { useState, useEffect } from 'react';
import { Input, Textarea } from '../../../components/forms/FormField';
import Button from '../../../components/common/Button';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useApp } from '../../../context/AppContext';
import { getContactSettings, updateContactSettings } from '../../../services/contentService';

export default function ContactSettingsPanel() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useApp();
  const [form, setForm] = useState(getContactSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(getContactSettings());
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const result = await updateContactSettings(form, user?.fullName || 'System Administrator');
    if (result.success) showToast(t('contactUpdated'), 'success');
    else showToast(result.error, 'error');
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-4 max-w-xl">
      <p className="text-sm text-[var(--color-mid-gray)]">
        {t('liveContactContent')}
      </p>
      <Textarea label={t('address')} rows={2} value={form.address} onChange={update('address')} />
      <Input label={t('phone')} value={form.phone} onChange={update('phone')} />
      <Input label={t('email')} type="email" value={form.email} onChange={update('email')} />
      <Input
        label={t('mapSearchQuery')}
        value={form.mapQuery}
        onChange={update('mapQuery')}
        hint={t('mapSearchHint')}
      />
      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave} loading={saving}>{t('saveChanges')}</Button>
      </div>
    </div>
  );
}
