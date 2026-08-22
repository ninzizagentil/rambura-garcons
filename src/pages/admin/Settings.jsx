import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import { FormSection } from '../../components/cards/InsightChartCards';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export default function Settings() {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    schoolName: 'Rambura Garçons TVET School',
    district: 'Nyabihu',
    contactEmail: 'info@ramburagarcons.rw',
    loanPeriodDays: '14',
    lowStockDefault: '10',
    aboutText: 'A Technical and Vocational Education and Training school in Nyabihu District, Rwanda.',
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Settings saved successfully.', 'success');
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
