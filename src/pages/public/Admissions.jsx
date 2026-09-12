import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, CalendarDays, ListChecks, Phone, User, Mail, GraduationCap, Send } from 'lucide-react';
import { Input, Select } from '../../components/forms/FormField';
import { FormSection } from '../../components/cards/InsightChartCards';
import Button from '../../components/common/Button';
import PageHero from '../../components/common/PageHero';
import { getPrograms, getAdmissionsInfo, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import { submitApplication } from '../../services/applicationService';

const REQUIRED_FIELDS = ['fullName', 'email', 'phone', 'program'];

export default function Admissions() {
  const contentVersion = useContentVersion();
  useSiteImageVersion();
  const [programs, setPrograms] = useState([]);
  const [info, setInfo] = useState({ intro: '', requirements: [], dates: [], process: '', contactLine: '' });
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', program: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [applicationReference, setApplicationReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    Promise.all([getPrograms(), getAdmissionsInfo()]).then(([nextPrograms, nextInfo]) => {
      setPrograms(nextPrograms);
      setInfo(nextInfo);
    }).catch((error) => setServerError(error.message));
  }, [contentVersion]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const program = programs.find((p) => p.slug === form.program);
    setSaving(true);
    setServerError('');
    try {
      const application = await submitApplication({ ...form, programLabel: program?.title });
      setApplicationReference(application.referenceNumber || application._id || application.id || 'Submitted');
      setSubmitted(true);
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHero title={info.title} image={getSiteImage('admissions.hero')}>
        <p className="text-[var(--text-secondary)] mt-3">{info.intro}</p>
      </PageHero>

      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-8">
        <div className="overflow-hidden rounded-[28px] aspect-[21/9] shadow-[0_28px_60px_rgba(31,41,55,0.12)] ring-1 ring-[rgba(31,41,55,0.06)]">
          <img src={getSiteImage('admissions.hero')} alt="Students at Rambura Garçons" className="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-3">
            {info.informationTitle}
          </h2>
          <p className="text-[var(--text-secondary)] text-lg">{info.informationIntro}</p>
          <span className="block w-16 h-1.5 rounded-full bg-[var(--gold)] mt-4" aria-hidden="true" />
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-[var(--gold)]">##</span> {info.requirementsTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{info.requirementsIntro}</p>
            </div>
            
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(15,108,255,0.10)]">
                  <ListChecks className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  {info.requirementsCardTitle}
                </h3>
              </div>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2.5">
                {info.requirements.map((r, idx) => (
                  <li key={r} className="flex gap-3 items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--gold)] text-white text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 mb-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-[var(--gold)]">##</span> {info.datesTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{info.datesIntro}</p>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(15,108,255,0.10)]">
                  <CalendarDays className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  {info.datesCardTitle}
                </h3>
              </div>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2.5">
                {info.dates.map((d) => (
                  <li key={d} className="flex gap-3 items-start">
                    <span className="text-[var(--gold)] font-semibold flex-shrink-0">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 mb-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-[var(--gold)]">##</span> {info.processTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{info.processIntro}</p>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(15,108,255,0.10)]">
                  <FileText className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  {info.processCardTitle}
                </h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {info.process}
              </p>
            </div>

            <div className="mt-8 mb-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-[var(--gold)]">##</span> {info.supportTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{info.supportIntro}</p>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(15,108,255,0.08),rgba(11,19,39,0.02))] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(15,108,255,0.12)]">
                  <Phone className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">{info.supportCardTitle}</h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {info.contactLine}
              </p>
              <div className="mt-5 pt-5 border-t border-[var(--border)] space-y-2">
                <a href="tel:+250788123456" className="flex items-center gap-2.5 text-sm font-medium text-[var(--gold)] hover:text-[var(--gold-hover)] transition-colors">
                  <Phone className="w-4 h-4" />
                  +250 788 123 456
                </a>
                <a href="mailto:info@ramburagarcons.rw" className="flex items-center gap-2.5 text-sm font-medium text-[var(--gold)] hover:text-[var(--gold-hover)] transition-colors">
                  <Mail className="w-4 h-4" />
                  info@ramburagarcons.rw
                </a>
              </div>
            </div>
            </div>

          <div className="border border-[var(--border)] shadow-[0_20px_45px_rgba(0,0,0,0.12)] rounded-[28px] p-6 sm:p-8 bg-[var(--surface)] backdrop-blur-sm sticky top-20">
            {submitted ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(15,108,255,0.10)] mb-4">
                <CheckCircle2 className="w-7 h-7 text-[var(--success)]" aria-hidden="true" />
              </div>
              <p className="font-display font-semibold text-lg text-[var(--text-primary)]">Application Submitted Successfully!</p>
              <p className="mt-3 inline-flex rounded-lg border border-[var(--border)] bg-[var(--color-soft-gray)] px-3 py-2 text-sm font-semibold tracking-wide text-[var(--gold)]">
                Reference: {applicationReference}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Thank you, <span className="font-semibold">{form.fullName.split(' ')[0]}</span>. We'll review your application and contact you at <span className="font-semibold">{form.email}</span> with next steps within 3-5 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {serverError && (
                <div className="p-4 rounded-lg bg-[rgba(15,108,255,0.08)] border border-[var(--gold)] text-[var(--gold)] text-sm font-medium">
                  {serverError}
                </div>
              )}
              <div>
                <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">{info.applicationTitle}</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{info.applicationIntro}</p>
                <span className="block w-12 h-1 rounded-full bg-[var(--gold)] mt-3" aria-hidden="true" />
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--gold)] text-white text-xs font-bold">1</span>
                    Personal Information
                  </h3>
                  <div className="space-y-4 pl-7">
                    <Input icon={User} label="Full Name" placeholder="Your complete name" required value={form.fullName} onChange={update('fullName')} error={errors.fullName} />
                    <Input icon={Mail} label="Email Address" type="email" placeholder="your.email@example.com" required value={form.email} onChange={update('email')} error={errors.email} />
                    <Input icon={Phone} label="Phone Number" placeholder="+250 xxx xxx xxx" required value={form.phone} onChange={update('phone')} error={errors.phone} />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--gold)] text-white text-xs font-bold">2</span>
                    Program Selection
                  </h3>
                  <div className="pl-7">
                    <Select
                      icon={GraduationCap}
                      label="Select Your Program"
                      placeholder="Choose a program you wish to apply for"
                      required
                      value={form.program}
                      onChange={update('program')}
                      error={errors.program}
                      options={programs.map((p) => ({ value: p.slug, label: p.title }))}
                    />
                  </div>
                </div>

              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                <Button type="submit" variant="primary" className="flex-1" icon={Send} iconPosition="right" loading={saving} disabled={saving}>
                  {saving ? 'Submitting...' : 'Submit Application'}
                </Button>
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2.5"
                  onClick={() => {
                    setForm({ fullName: '', email: '', phone: '', program: '', message: '' });
                    setErrors({});
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          )}
        </div>
        </div>
      </section>
    </div>
  );
}
