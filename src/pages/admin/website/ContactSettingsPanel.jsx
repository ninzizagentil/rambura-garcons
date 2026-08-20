import { useState, useEffect } from 'react';
import { Input, Textarea } from '../../../components/forms/FormField';
import Button from '../../../components/common/Button';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { getContactSettings, updateContactSettings } from '../../../services/contentService';

export default function ContactSettingsPanel() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(getContactSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(getContactSettings());
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      updateContactSettings(form, user?.fullName || 'System Administrator');
      setSaving(false);
      showToast('Contact page details updated successfully.', 'success');
    }, 300);
  };

  return (
    <div className="p-6 space-y-4 max-w-xl">
      <p className="text-sm text-[var(--color-mid-gray)]">
        This content is shown live on the public Contact page.
      </p>
      <Textarea label="Address" rows={2} value={form.address} onChange={update('address')} />
      <Input label="Phone" value={form.phone} onChange={update('phone')} />
      <Input label="Email" type="email" value={form.email} onChange={update('email')} />
      <Input
        label="Map Search Query"
        value={form.mapQuery}
        onChange={update('mapQuery')}
        hint="Used to render the embedded Google Map, e.g. Rambura,Nyabihu+District,Rwanda"
      />
      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
    </div>
  );
}
