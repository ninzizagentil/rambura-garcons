import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import ImageField from '../../components/forms/ImageField';
import { FormSection } from '../../components/cards/InsightChartCards';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getBranding, updateSiteLogo, resetSiteLogo } from '../../services/brandingService';

export default function Settings() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    schoolName: 'Rambura Garçons TVET School',
    district: 'Nyabihu',
    contactEmail: 'info@ramburagarcons.rw',
    loanPeriodDays: '14',
    lowStockDefault: '10',
    aboutText: 'A Technical and Vocational Education and Training school in Nyabihu District, Rwanda.',
  });
  const [logoUrl, setLogoUrl] = useState(() => getBranding().logoUrl);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Settings saved successfully.', 'success');
  };

  // The logo saves the moment a file is chosen — unlike the rest of this
  // form, it isn't tied to the "Save Settings" button, so it takes effect
  // everywhere (sidebar, login page, public site, footer) right away.
  const handleLogoChange = async (dataUrl) => {
    if (!dataUrl) {
      const result = await resetSiteLogo(user);
      if (!result.success) { showToast(result.error, 'error'); return; }
      setLogoUrl('');
      showToast('Logo removed — the default badge will show instead.', 'success');
      return;
    }
    const result = await updateSiteLogo(dataUrl, user);
    if (result.success) {
      setLogoUrl(dataUrl);
      showToast('Logo updated everywhere it appears.', 'success');
    } else {
      showToast(result.error, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="System-wide configuration."
        breadcrumb={[{ label: 'Admin', to: '/admin' }, { label: 'Settings' }]}
      />
      <form onSubmit={handleSave} className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 max-w-2xl space-y-6">
        <FormSection title="School Information">
          <ImageField
            label="School Logo"
            value={logoUrl}
            onChange={handleLogoChange}
            hint="Shows in the admin sidebar, login page, public site header, and footer. PNG with a transparent background works best."
            className="sm:col-span-2"
          />
          <Input label="School Name" value={form.schoolName} onChange={update('schoolName')} />
          <Input label="District" value={form.district} onChange={update('district')} />
          <Input label="Contact Email" type="email" value={form.contactEmail} onChange={update('contactEmail')} className="sm:col-span-2" />
          <Textarea label="About Text" value={form.aboutText} onChange={update('aboutText')} className="sm:col-span-2" />
        </FormSection>

        <FormSection title="Library Settings">
          <Select
            label="Default Loan Period"
            value={form.loanPeriodDays}
            onChange={update('loanPeriodDays')}
            options={[{ value: '7', label: '7 days' }, { value: '14', label: '14 days' }, { value: '21', label: '21 days' }, { value: '30', label: '30 days' }]}
          />
        </FormSection>

        <FormSection title="Stock Settings">
          <Input label="Default Minimum Stock Level" type="number" value={form.lowStockDefault} onChange={update('lowStockDefault')} />
        </FormSection>

        <Button type="submit" variant="primary">Save Settings</Button>
      </form>
    </div>
  );
}
