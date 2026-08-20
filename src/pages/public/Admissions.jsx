import { useState } from 'react';
import { CheckCircle2, FileText, CalendarDays, ListChecks, Phone, User, Mail, GraduationCap, Send } from 'lucide-react';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import { FormSection } from '../../components/cards/InsightChartCards';
import Button from '../../components/common/Button';
import PageHero from '../../components/common/PageHero';
import { getPrograms, getAdmissionsInfo } from '../../services/contentService';
import { getSiteImage } from '../../services/imageService';

const REQUIRED_FIELDS = ['fullName', 'email', 'phone', 'program'];

export default function Admissions() {
  const programs = getPrograms();
  const info = getAdmissionsInfo();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', program: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    REQUIRED_FIELDS.forEach((f) => {
      if (!form[f]?.trim()) next[f] = 'This field is required.';
    });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) setSubmitted(true);
  };

  return (
    <div>
      <PageHero title="Admissions">
        <p className="text-white/80 mt-3">{info.intro}</p>
      </PageHero>

      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-8">
        <div className="rounded-[var(--radius-card)] overflow-hidden aspect-[21/9] shadow-card-hover">
          <img src={getSiteImage('admissions.hero')} alt="Students at Rambura Garçons" className="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 md:px-6 py-14 grid lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--color-dark-gray)] mb-2">
              <ListChecks className="w-5 h-5 text-[var(--color-medium-green)]" /> Requirements
            </h2>
            <ul className="text-sm text-[var(--color-mid-gray)] space-y-1.5 list-disc list-inside">
              {info.requirements.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--color-dark-gray)] mb-2">
              <CalendarDays className="w-5 h-5 text-[var(--color-medium-green)]" /> Important Dates
            </h2>
            <ul className="text-sm text-[var(--color-mid-gray)] space-y-1.5">
              {info.dates.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--color-dark-gray)] mb-2">
              <FileText className="w-5 h-5 text-[var(--color-medium-green)]" /> Admission Process
            </h2>
            <p className="text-sm text-[var(--color-mid-gray)]">
              {info.process}
            </p>
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--color-dark-gray)] mb-2">
              <Phone className="w-5 h-5 text-[var(--color-medium-green)]" /> Contact
            </h2>
            <p className="text-sm text-[var(--color-mid-gray)]">{info.contactLine}</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[var(--color-navy-800)] to-[var(--color-navy-900)] border border-white/10 shadow-xl rounded-2xl p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-[var(--color-gold)] mx-auto mb-3" aria-hidden="true" />
              <p className="font-display font-semibold text-white">Application received</p>
              <p className="text-sm text-white/70 mt-1">
                Thank you, {form.fullName.split(' ')[0]}. We'll contact you at {form.email} with next steps.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Application Form</h2>
                <span className="block w-10 h-1 rounded-full bg-[var(--color-gold)] mt-2" aria-hidden="true" />
              </div>
              <FormSection>
                <Input dark icon={User} label="Full Name" required value={form.fullName} onChange={update('fullName')} error={errors.fullName} />
                <Input dark icon={Mail} label="Email" type="email" required value={form.email} onChange={update('email')} error={errors.email} />
                <Input dark icon={Phone} label="Phone" required value={form.phone} onChange={update('phone')} error={errors.phone} />
                <Select
                  dark
                  icon={GraduationCap}
                  label="Program"
                  required
                  value={form.program}
                  onChange={update('program')}
                  error={errors.program}
                  options={programs.map((p) => ({ value: p.slug, label: p.title }))}
                />
              </FormSection>
              <Textarea dark label="Message (optional)" value={form.message} onChange={update('message')} placeholder="Anything else we should know?" />
              <div className="flex items-center gap-5 pt-1">
                <Button type="submit" variant="gold" className="flex-1" icon={Send} iconPosition="right">Submit Application</Button>
                <button
                  type="button"
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                  onClick={() => setForm({ fullName: '', email: '', phone: '', program: '', message: '' })}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
