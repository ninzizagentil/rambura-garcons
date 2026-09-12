import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import ImageField from '../../components/forms/ImageField';
import { FormSection } from '../../components/cards/InsightChartCards';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getBranding, updateSiteLogo, resetSiteLogo } from '../../services/brandingService';
import { disableTwoFactor, enableTwoFactor, setupTwoFactor } from '../../services/authService';

export default function Settings() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useApp();
  const [form, setForm] = useState({
    schoolName: 'Rambura Garçons TVET School',
    district: 'Nyabihu',
    contactEmail: 'info@ramburagarcons.rw',
    loanPeriodDays: '14',
    lowStockDefault: '10',
    aboutText: 'A Technical and Vocational Education and Training school in Nyabihu District, Rwanda.',
  });
  const [logoUrl, setLogoUrl] = useState(() => getBranding().logoUrl);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const startTwoFactorSetup = async () => {
    try {
      const result = await setupTwoFactor();
      setTwoFactorSecret(result.secret);
      showToast(t('setupSecretGenerated'), 'info');
    } catch (error) { showToast(error.message, 'error'); }
  };

  const confirmTwoFactor = async () => {
    try {
      await enableTwoFactor(twoFactorSecret, twoFactorCode);
      showToast(t('twoFactorEnabled'), 'success');
      setTwoFactorEnabled(true);
      setTwoFactorSecret(''); setTwoFactorCode('');
    } catch (error) { showToast(error.message, 'error'); }
  };

  const turnOffTwoFactor = async () => {
    try {
      await disableTwoFactor(disablePassword, twoFactorCode);
      showToast(t('twoFactorDisabled'), 'success');
      setTwoFactorEnabled(false);
      setDisablePassword(''); setTwoFactorCode('');
    } catch (error) { showToast(error.message, 'error'); }
  };

  const handleSave = (e) => {
    e.preventDefault();
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
          <Input label={t('schoolName')} value={form.schoolName} onChange={update('schoolName')} />
          <Input label={t('district')} value={form.district} onChange={update('district')} />
          <Input label={t('contactEmail')} type="email" value={form.contactEmail} onChange={update('contactEmail')} className="sm:col-span-2" />
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
          <Input label={t('defaultMinimumStock')} type="number" value={form.lowStockDefault} onChange={update('lowStockDefault')} />
        </FormSection>

        {user?.role === 'admin' && (
          <FormSection title={t('administratorSecurity')} description={t('administratorSecurityDescription')}>
            <div className="sm:col-span-2 rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4">
              <p className="text-sm font-semibold text-[var(--color-dark-gray)]">{t('twoFactorAuthentication')}: {twoFactorEnabled ? t('enabled') : t('notEnabled')}</p>
              {!twoFactorEnabled ? (
                <div className="mt-3 space-y-3">
                  <Button type="button" variant="secondary" onClick={startTwoFactorSetup}>{t('generateSetupSecret')}</Button>
                  {twoFactorSecret && <>
                    <p className="break-all rounded-lg bg-[var(--color-white)] p-3 font-mono text-xs text-[var(--color-dark-gray)]">{twoFactorSecret}</p>
                    <Input label={t('authenticatorCode')} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" maxLength={6} />
                    <Button type="button" onClick={confirmTwoFactor}>{t('enable2fa')}</Button>
                  </>}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <Input label={t('currentPassword')} type="password" value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} />
                  <Input label={t('authenticatorCode')} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" maxLength={6} />
                  <Button type="button" variant="danger" onClick={turnOffTwoFactor}>{t('disable2fa')}</Button>
                </div>
              )}
            </div>
          </FormSection>
        )}

        <Button type="submit" variant="primary">{t('saveSettings')}</Button>
      </form>
    </div>
  );
}
