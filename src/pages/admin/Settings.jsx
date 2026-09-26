import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import ImageField from '../../components/forms/ImageField';
import { FormSection } from '../../components/cards/InsightChartCards';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getBranding, updateSiteLogo, resetSiteLogo } from '../../services/brandingService';
import { getSystemSettings, refreshContent, updateSystemSettings } from '../../services/contentService';
import { applyKindErrors } from '../../utils/validators';

// What each settings field may contain — see utils/validators.js
const SETTINGS_KINDS = { schoolName: 'alnum', district: 'name', contactEmail: 'email', lowStockDefault: 'integer' };

export default function Settings() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useApp();
  const [form, setForm] = useState(getSystemSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(() => getBranding().logoUrl);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  useEffect(() => {
    refreshContent().then(() => {
      setForm(getSystemSettings());
      setLoading(false);
    }).catch((error) => { showToast(error.message, 'error'); setLoading(false); });
  }, [showToast]);

  const handleSave = async (e) => {
    e.preventDefault();
    const problem = Object.values(applyKindErrors({}, form, SETTINGS_KINDS, t))[0];
    if (problem) { showToast(problem, 'error'); return; }
    setSaving(true);
    const result = await updateSystemSettings(form);
    setSaving(false);
    if (!result.success) {
      showToast(result.error || t('couldNotSaveSettings'), 'error');
      return;
    }
    showToast(t('settingsSaved'), 'success');
  };

  // The logo saves the moment a file is chosen — unlike the rest of this
  // form, it isn't tied to the "Save Settings" button, so it takes effect
  // everywhere (sidebar, login page, public site, footer) right away.
  const handleLogoChange = async (dataUrl) => {
    if (!dataUrl) {
      const result = await resetSiteLogo(user);
      if (!result.success) { showToast(result.error, 'error'); return; }
      setLogoUrl('');
      showToast(t('logoRemoved'), 'success');
      return;
    }
    const result = await updateSiteLogo(dataUrl, user);
    if (result.success) {
      setLogoUrl(dataUrl);
      showToast(t('logoUpdated'), 'success');
    } else {
      showToast(result.error, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('settings')}
        description={t('systemWideConfiguration')}
        breadcrumb={[{ label: t('admin'), to: '/admin' }, { label: t('settings') }]}
      />
      <form onSubmit={handleSave} className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 max-w-2xl mx-auto space-y-6">
        <FormSection title={t('schoolInformation')}>
          <ImageField
            label={t('schoolLogo')}
            value={logoUrl}
            onChange={handleLogoChange}
            hint={t('schoolLogoHint')}
            className="sm:col-span-2"
          />
          <Input kind="alnum" label={t('schoolName')} value={form.schoolName} onChange={update('schoolName')} />
          <Input kind="name" label={t('district')} value={form.district} onChange={update('district')} />
          <Input kind="email" label={t('contactEmail')} type="email" value={form.contactEmail} onChange={update('contactEmail')} className="sm:col-span-2" />
          <Textarea label={t('aboutText')} value={form.aboutText} onChange={update('aboutText')} className="sm:col-span-2" />
        </FormSection>

        <FormSection title={t('librarySettings')}>
          <Select
            label={t('defaultLoanPeriod')}
            value={form.loanPeriodDays}
            onChange={update('loanPeriodDays')}
            options={[7, 14, 21, 30].map((days) => ({ value: String(days), label: t('daysCount', { count: days }) }))}
          />
        </FormSection>

        <FormSection title={t('stockSettings')}>
          <Input kind="integer" label={t('defaultMinimumStock')} type="number" value={form.lowStockDefault} onChange={update('lowStockDefault')} />
        </FormSection>

        <Button type="submit" variant="primary" loading={saving} disabled={loading}>{t('saveSettings')}</Button>
      </form>
    </div>
  );
}
