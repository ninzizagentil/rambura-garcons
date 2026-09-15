import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, CalendarDays, ListChecks, Phone, User, Mail, GraduationCap, Send, ArrowDown, Printer, Upload } from 'lucide-react';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import PageHero from '../../components/common/PageHero';
import { getPrograms, getAdmissionsInfo, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import { submitApplication } from '../../services/applicationService';

const REQUIRED_FIELDS = ['fullName', 'email', 'phone', 'program', 'dateOfBirth', 'gender', 'educationLevel', 'district', 'guardianName', 'guardianPhone', 'guardianRelationship'];
const CURRENT_YEAR = new Date().getFullYear();

function readAttachment(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      reject(new Error('Please choose a PDF, JPG, or PNG file.'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('Each attachment must be smaller than 2 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

export default function Admissions() {
  const contentVersion = useContentVersion();
  useSiteImageVersion();
  const [programs, setPrograms] = useState([]);
  const [info, setInfo] = useState({ intro: '', requirements: [], dates: [], process: '', contactLine: '' });
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', program: '', dateOfBirth: '', gender: '',
    educationLevel: '', district: '', previousSchool: '', guardianName: '',
    guardianPhone: '', guardianRelationship: '', emergencyContactName: '', emergencyContactPhone: '',
    intakeYear: String(CURRENT_YEAR), message: '', privacyConsent: false, applicantPhoto: '', supportingDocument: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [applicationReference, setApplicationReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [openSection, setOpenSection] = useState(1);
  const resetForm = () => {
    setForm({ fullName: '', email: '', phone: '', program: '', dateOfBirth: '', gender: '', educationLevel: '', district: '', previousSchool: '', guardianName: '', guardianPhone: '', guardianRelationship: '', emergencyContactName: '', emergencyContactPhone: '', intakeYear: String(CURRENT_YEAR), message: '', privacyConsent: false, applicantPhoto: '', supportingDocument: '' });
    setErrors({});
    setServerError('');
    setSubmitted(false);
    setApplicationReference('');
    setOpenSection(1);
  };

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
    if (!form.privacyConsent) next.privacyConsent = 'Please accept the privacy notice to continue.';
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

      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="relative z-10 mt-8 grid overflow-hidden rounded-2xl border border-[var(--gold)]/35 bg-[var(--surface)] shadow-[0_20px_42px_rgba(7,35,29,0.18)] sm:grid-cols-3">
          {[
            { label: 'What you need', value: `${info.requirements.length || 'Clear'} requirements`, icon: ListChecks },
            { label: 'When to apply', value: `${info.dates.length || 'Key'} important dates`, icon: CalendarDays },
            { label: 'How to start', value: 'Complete the form', icon: ArrowDown },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex min-h-24 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6">
              <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-deep-green)] text-[var(--gold)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</p>
                <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">{value}</p>
              </div>
            </div>
          ))}
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
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 shadow-[0_20px_45px_rgba(23,59,49,0.10)]">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">01 / Prepare</p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{info.requirementsTitle}</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{info.requirementsIntro}</p>
            </div>
            
            <div className="border-b border-[var(--border)] pb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(15,108,255,0.10)]">
                  <ListChecks className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  {info.requirementsCardTitle}
                </h3>
              </div>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2.5">
                {info.requirements.map((r) => (
                  <li key={r} className="flex gap-3 items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--gold)] text-white text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">02 / Plan</p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{info.datesTitle}</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{info.datesIntro}</p>
            </div>

            <div className="border-b border-[var(--border)] pb-6">
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

            <div className="mt-7 mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">03 / Apply</p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{info.processTitle}</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{info.processIntro}</p>
            </div>

            <div className="border-b border-[var(--border)] pb-6">
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

            <div className="mt-7 mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">Need help?</p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{info.supportTitle}</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{info.supportIntro}</p>
            </div>

            <div className="pt-1">
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

          <div id="application-form" className="border border-[var(--border)] shadow-[0_20px_45px_rgba(23,59,49,0.10)] rounded-[28px] p-5 sm:p-8 bg-[var(--surface)]">
            {submitted ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(15,108,255,0.10)] mb-4">
                <CheckCircle2 className="w-7 h-7 text-[var(--success)]" aria-hidden="true" />
              </div>
              <p className="font-display font-semibold text-lg text-[var(--text-primary)]">Application Submitted Successfully!</p>
              <p className="mt-3 inline-flex rounded-lg border border-[var(--border)] bg-[var(--color-soft-gray)] px-3 py-2 text-sm font-semibold tracking-wide text-[var(--gold)]">
                Reference: {applicationReference}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3 print:hidden">
                <Button type="button" variant="secondary" icon={Printer} onClick={() => window.print()}>Print Confirmation</Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Submit Another Application</Button>
              </div>
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
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">Start here</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">{info.applicationTitle}</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{info.applicationIntro}</p>
                <p className="mt-3 text-xs font-medium text-[var(--text-secondary)]"><span className="text-[var(--gold)]">*</span> Required information</p>
                <span className="block w-12 h-1 rounded-full bg-[var(--gold)] mt-3" aria-hidden="true" />
              </div>
              
              <div className="space-y-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--color-soft-gray)]/25 px-4 sm:px-5">
                <details open={openSection === 1} onToggle={(event) => setOpenSection(event.currentTarget.open ? 1 : null)} className="group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5">
                  <summary className="flex cursor-pointer list-none items-center gap-3 font-display font-semibold text-[var(--text-primary)] text-base [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--gold)] text-white text-sm font-bold">1</span>
                    Personal Information
                    <span className="ml-auto text-xs font-medium text-[var(--text-secondary)] group-open:hidden">Open</span>
                  </summary>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input icon={User} label="Full Name" placeholder="Your complete name" required value={form.fullName} onChange={update('fullName')} error={errors.fullName} />
                    <Input icon={Mail} label="Email Address" type="email" placeholder="your.email@example.com" required value={form.email} onChange={update('email')} error={errors.email} />
                    <Input icon={Phone} label="Phone Number" placeholder="+250 xxx xxx xxx" required value={form.phone} onChange={update('phone')} error={errors.phone} />
                    <Input label="Date of Birth" type="date" required value={form.dateOfBirth} onChange={update('dateOfBirth')} error={errors.dateOfBirth} />
                    <Select label="Gender" placeholder="Select gender" required value={form.gender} onChange={update('gender')} error={errors.gender} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'prefer-not-to-say', label: 'Prefer not to say' }]} />
                    <Select label="Highest Education Level" placeholder="Select education level" required value={form.educationLevel} onChange={update('educationLevel')} error={errors.educationLevel} options={[{ value: 'ordinary-level', label: 'Ordinary Level (O-Level)' }, { value: 'advanced-level', label: 'Advanced Level (A-Level)' }, { value: 'equivalent', label: 'Equivalent qualification' }]} />
                    <Input label="District of Residence" placeholder="e.g. Nyabihu" required value={form.district} onChange={update('district')} error={errors.district} />
                    <Input label="Previous School" placeholder="Name of your previous school" value={form.previousSchool} onChange={update('previousSchool')} className="sm:col-span-2" />
                    <Select label="Intake Year" required value={form.intakeYear} onChange={update('intakeYear')} options={[0, 1, 2].map((offset) => ({ value: String(CURRENT_YEAR + offset), label: String(CURRENT_YEAR + offset) }))} />
                  </div>
                </details>

                <details open={openSection === 2} onToggle={(event) => setOpenSection(event.currentTarget.open ? 2 : null)} className="group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5">
                  <summary className="flex cursor-pointer list-none items-center gap-3 font-display font-semibold text-[var(--text-primary)] text-base [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--gold)] text-white text-sm font-bold">2</span>
                    Program Selection
                    <span className="ml-auto text-xs font-medium text-[var(--text-secondary)] group-open:hidden">Open</span>
                  </summary>
                  <div>
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
                </details>

                <details open={openSection === 3} onToggle={(event) => setOpenSection(event.currentTarget.open ? 3 : null)} className="group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5">
                  <summary className="flex cursor-pointer list-none items-center gap-3 font-display font-semibold text-[var(--text-primary)] text-base [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--gold)] text-white text-sm font-bold">3</span>
                    Parent or Guardian
                    <span className="ml-auto text-xs font-medium text-[var(--text-secondary)] group-open:hidden">Open</span>
                  </summary>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Guardian Full Name" placeholder="Parent or guardian name" required value={form.guardianName} onChange={update('guardianName')} error={errors.guardianName} />
                    <Input label="Guardian Phone Number" placeholder="+250 xxx xxx xxx" required value={form.guardianPhone} onChange={update('guardianPhone')} error={errors.guardianPhone} />
                    <Input label="Relationship" placeholder="e.g. Father, Mother, Guardian" required value={form.guardianRelationship} onChange={update('guardianRelationship')} error={errors.guardianRelationship} />
                    <Input label="Emergency Contact Name" placeholder="Alternative contact person" value={form.emergencyContactName} onChange={update('emergencyContactName')} />
                    <Input label="Emergency Contact Phone" placeholder="+250 xxx xxx xxx" value={form.emergencyContactPhone} onChange={update('emergencyContactPhone')} />
                  </div>
                </details>

                <details open={openSection === 4} onToggle={(event) => setOpenSection(event.currentTarget.open ? 4 : null)} className="group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5">
                  <summary className="flex cursor-pointer list-none items-center gap-3 font-display font-semibold text-[var(--text-primary)] text-base [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--gold)] text-white text-sm font-bold">4</span>
                    Your Motivation
                    <span className="ml-auto text-xs font-medium text-[var(--text-secondary)] group-open:hidden">Open</span>
                  </summary>
                  <div>
                    <Textarea label="Why do you want to join this program?" placeholder="Tell us briefly about your goals and interests." value={form.message} onChange={update('message')} rows={4} />
                  </div>
                </details>

                <details open={openSection === 5} onToggle={(event) => setOpenSection(event.currentTarget.open ? 5 : null)} className="group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5">
                  <summary className="flex cursor-pointer list-none items-center gap-3 font-display font-semibold text-[var(--text-primary)] text-base [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--gold)] text-white text-sm font-bold">5</span>
                    Supporting Documents
                    <span className="ml-auto text-xs font-medium text-[var(--text-secondary)] group-open:hidden">Open</span>
                  </summary>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[['applicantPhoto', 'Applicant Photo', 'Optional passport-style photo'], ['supportingDocument', 'Identity or Certificate', 'Optional PDF, JPG, or PNG']].map(([field, label, hint]) => (
                      <label key={field} className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--color-soft-gray)] p-4 text-sm">
                        <span className="flex items-center gap-2 font-semibold text-[var(--text-primary)]"><Upload className="h-4 w-4 text-[var(--gold)]" />{label}</span>
                        <span className="text-xs text-[var(--text-secondary)]">{form[field] ? 'File attached' : `${hint} (max 2 MB)`}</span>
                        <input type="file" accept={field === 'applicantPhoto' ? 'image/jpeg,image/png' : 'application/pdf,image/jpeg,image/png'} className="sr-only" onChange={(e) => {
                          readAttachment(e.target.files?.[0]).then((value) => {
                            setServerError('');
                            setForm((current) => ({ ...current, [field]: value }));
                          }).catch((error) => setServerError(error.message));
                        }} />
                      </label>
                    ))}
                  </div>
                </details>

              </div>

              <label className="flex items-start gap-3 pt-5 border-t border-[var(--border)] text-sm text-[var(--text-secondary)] cursor-pointer">
                <input type="checkbox" checked={form.privacyConsent} onChange={(e) => setForm((current) => ({ ...current, privacyConsent: e.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--gold)]" />
                <span>I confirm that the information provided is accurate and agree that Rambura Garçons School may use it to process this application.</span>
              </label>
              {errors.privacyConsent && <p className="-mt-4 text-sm text-[var(--color-status-red)]">{errors.privacyConsent}</p>}

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary" className="flex-1" icon={Send} iconPosition="right" loading={saving} disabled={saving}>
                  {saving ? 'Submitting...' : 'Submit Application'}
                </Button>
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2.5"
                  onClick={resetForm}
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
