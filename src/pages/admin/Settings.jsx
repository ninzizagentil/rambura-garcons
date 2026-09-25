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
import { disableTwoFactor, enableTwoFactor, setupTwoFactor } from '../../services/authService';
import { getSystemSettings, refreshContent, updateSystemSettings, getEmailSettings, updateEmailSettings } from '../../services/contentService';
import { applyKindErrors } from '../../utils/validators';
import QRCode from 'qrcode';

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
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [emailSettings, setEmailSettings] = useState({ host: '', port: 587, secure: false, user: '', from: '', password: '', configured: false });
  const [emailSaving, setEmailSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  useEffect(() => {
    const emailRequest = user?.role === 'admin' ? getEmailSettings() : Promise.resolve(null);
    Promise.all([refreshContent(), emailRequest]).then(([, email]) => {
      setForm(getSystemSettings());
      if (email) setEmailSettings({ ...email, password: '' });
      setLoading(false);
    }).catch((error) => { showToast(error.message, 'error'); setLoading(false); });
  }, [user?.role, showToast]);

  const startTwoFactorSetup = async () => {
    try {
      const result = await setupTwoFactor();
      setTwoFactorSecret(result.secret);
      setRecoveryCodes(result.recoveryCodes || []);
      setTwoFactorQrCode(await QRCode.toDataURL(result.otpauthUrl));
      showToast(t('setupSecretGenerated'), 'info');
    } catch (error) { showToast(error.message, 'error'); }
  };

  const confirmTwoFactor = async () => {
    try {
      await enableTwoFactor(twoFactorSecret, twoFactorCode, recoveryCodes);
      showToast(t('twoFactorEnabled'), 'success');
      setTwoFactorEnabled(true);
      setTwoFactorSecret(''); setTwoFactorCode(''); setTwoFactorQrCode(''); setRecoveryCodes([]);
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

  const saveEmailSettings = async (e) => {
    e.preventDefault();
    if (!emailSettings.host.trim() || !emailSettings.from.trim()) {
      showToast(t('emailSettingsRequired'), 'error');
      return;
    }
    setEmailSaving(true);
    const result = await updateEmailSettings(emailSettings);
    setEmailSaving(false);
    if (!result.success) { showToast(result.error || t('couldNotSaveSettings'), 'error'); return; }
    setEmailSettings((current) => ({ ...current, ...result.settings, password: '' }));
    showToast(t('emailSettingsSaved'), 'success');
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

        {user?.role === 'admin' && (
          <FormSection title={t('emailDelivery')} description={t('emailDeliveryDescription')}>
            <Input label={t('smtpHost')} value={emailSettings.host} onChange={(event) => setEmailSettings((current) => ({ ...current, host: event.target.value }))} />
            <Input kind="integer" label={t('smtpPort')} type="number" value={emailSettings.port} onChange={(event) => setEmailSettings((current) => ({ ...current, port: event.target.value }))} />
            <Input label={t('smtpUsername')} type="email" value={emailSettings.user} onChange={(event) => setEmailSettings((current) => ({ ...current, user: event.target.value }))} />
            <Input label={t('senderEmail')} type="email" value={emailSettings.from} onChange={(event) => setEmailSettings((current) => ({ ...current, from: event.target.value }))} />
            <Input label={t('smtpAppPassword')} type="password" value={emailSettings.password} onChange={(event) => setEmailSettings((current) => ({ ...current, password: event.target.value }))} />
            <label className="flex items-center gap-2 text-sm text-[var(--color-dark-gray)]"><input type="checkbox" checked={emailSettings.secure} onChange={(event) => setEmailSettings((current) => ({ ...current, secure: event.target.checked }))} /> {t('useSecureSmtp')}</label>
            <div className="sm:col-span-2 flex items-center justify-between gap-3"><span className="text-xs text-[var(--color-mid-gray)]">{emailSettings.configured ? t('smtpPasswordConfigured') : t('smtpNotConfigured')}</span><Button type="button" variant="secondary" loading={emailSaving} onClick={saveEmailSettings}>{t('saveEmailSettings')}</Button></div>
          </FormSection>
        )}

        {user?.role === 'admin' && (
          <FormSection title={t('administratorSecurity')} description={t('administratorSecurityDescription')}>
            <div className="sm:col-span-2 rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4">
              <p className="text-sm font-semibold text-[var(--color-dark-gray)]">{t('twoFactorAuthentication')}: {twoFactorEnabled ? t('enabled') : t('notEnabled')}</p>
              {!twoFactorEnabled ? (
                <div className="mt-3 space-y-3">
                  <Button type="button" variant="secondary" onClick={startTwoFactorSetup}>{t('generateSetupSecret')}</Button>
                  {twoFactorSecret && <>
                    {twoFactorQrCode && <img src={twoFactorQrCode} alt={t('scanQrCode')} className="h-44 w-44 rounded-lg bg-white p-2" />}
                    <p className="break-all rounded-lg bg-[var(--color-white)] p-3 font-mono text-xs text-[var(--color-dark-gray)]">{twoFactorSecret}</p>
                    <div className="rounded-lg bg-[var(--color-white)] p-3 text-xs text-[var(--color-dark-gray)]"><p className="font-semibold">{t('recoveryCodes')}</p><p className="mt-1">{t('saveRecoveryCodes')}</p><div className="mt-2 grid grid-cols-2 gap-1 font-mono">{recoveryCodes.map((code) => <span key={code}>{code}</span>)}</div></div>
                    <Input kind="digits" label={t('authenticatorCode')} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" maxLength={6} />
                    <Button type="button" onClick={confirmTwoFactor}>{t('enable2fa')}</Button>
                  </>}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <Input label={t('currentPassword')} type="password" value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} />
                  <Input label={t('authenticatorCode')} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.toUpperCase())} placeholder={t('authenticatorOrRecoveryCode')} />
                  <Button type="button" variant="danger" onClick={turnOffTwoFactor}>{t('disable2fa')}</Button>
                </div>
              )}
            </div>
          </FormSection>
        )}

        <Button type="submit" variant="primary" loading={saving} disabled={loading}>{t('saveSettings')}</Button>
      </form>
    </div>
  );
}
