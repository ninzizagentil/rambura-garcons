import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, CalendarDays, ListChecks, Phone, User, Mail, GraduationCap, Send, ArrowDown, Printer, Upload, ChevronLeft, ChevronRight, ShieldCheck, Search, Clock, XCircle, Paperclip, AlertCircle, Loader2 } from 'lucide-react';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import PageHero from '../../components/common/PageHero';
import BrandMark from '../../components/common/BrandMark';
import { getPrograms, getAdmissionsInfo, getContactInfo, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import { submitApplication, trackApplication, getAdminAttachmentUrl } from '../../services/applicationService';
import { applyKindErrors } from '../../utils/validators';

const REQUIRED_FIELDS = ['fullName', 'email', 'phone', 'program', 'dateOfBirth', 'gender', 'educationLevel', 'district', 'guardianName', 'guardianPhone', 'guardianRelationship'];
const CURRENT_YEAR = new Date().getFullYear();
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const STEPS = [
  { number: 1, label: 'About you', fields: ['fullName', 'email', 'phone', 'dateOfBirth', 'gender', 'educationLevel', 'district', 'previousSchool', 'intakeYear'] },
  { number: 2, label: 'Your program', fields: ['program'] },
  { number: 3, label: 'Guardian', fields: ['guardianName', 'guardianPhone', 'guardianRelationship', 'emergencyContactName', 'emergencyContactPhone'] },
  { number: 4, label: 'Finish', fields: ['message', 'applicantPhoto', 'supportingDocument', 'privacyConsent'] },
];

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:      { label: 'Submitted',   color: 'bg-blue-50 text-blue-700 border-blue-200',    icon: Clock },
  reviewed: { label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Search },
  accepted: { label: 'Accepted',    color: 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)]', icon: CheckCircle2 },
  declined: { label: 'Declined',    color: 'bg-red-50 text-red-600 border-red-200',       icon: XCircle },
};

// ─── Track Application Section ────────────────────────────────────────────────
function TrackApplicationSection() {
  const [reference, setReference] = useState('');
  const [contact, setContact] = useState('');
  const [result, setResult] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    const ref = reference.trim();
    const contactValue = contact.trim();
    if (!ref || !contactValue) { setError('Please enter your reference number and the email address or phone number you applied with.'); return; }
    setTracking(true);
    setError('');
    setResult(null);
    try {
      const data = await trackApplication(ref, contactValue);
      setResult(data);
    } catch (err) {
      setError(err.message || 'No application found. Please check your details and try again.');
    } finally {
      setTracking(false);
    }
  };

  const cfg = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG.new) : null;
  const StatusIcon = cfg?.icon;

  return (
    <section id="track-application" className="max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-4 scroll-mt-24">
      <div className="rounded-[28px] border border-[var(--gold)]/30 bg-[var(--surface)] shadow-[0_16px_40px_rgba(23,59,49,0.12)] overflow-hidden">

        {/* Header */}
        <div className="bg-[var(--surface)] px-6 py-6 sm:px-8 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold)] mb-1">Admissions</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Track your admission request</h2>
          <div className="mt-3 max-w-lg rounded-xl border border-white/10 bg-[color-mix(in_srgb,var(--surface)_68%,transparent)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Enter your reference number together with the email address or phone number you used on the application to check its status.
            </p>
          </div>
        </div>

        {/* Search form */}
        <div className="px-6 py-6 sm:px-8 border-b border-[var(--border)]">
          <form onSubmit={handleTrack} noValidate>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <label htmlFor="track-reference" className="sr-only">Reference number</label>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
                <input
                  id="track-reference"
                  type="text"
                  value={reference}
                  onChange={(e) => { setReference(e.target.value); setError(''); }}
                  placeholder="Reference number (e.g. RG-2026-AB12CD)"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50 transition"
                />
              </div>
              <div className="relative flex-1">
                <label htmlFor="track-contact" className="sr-only">Email or phone number used on the application</label>
                <input
                  id="track-contact"
                  type="text"
                  value={contact}
                  onChange={(e) => { setContact(e.target.value); setError(''); }}
                  placeholder="Email or phone used to apply"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-4 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50 transition"
                />
              </div>
              <button
                type="submit"
                disabled={tracking}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[var(--gold-hover)] disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto w-full"
              >
                {tracking
                  ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking…</>
                  : <><Search className="h-4 w-4" aria-hidden="true" /> Check status</>
                }
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Result card */}
        {result && cfg && (
          <div className="px-6 py-6 sm:px-8 space-y-5">
            {/* Status banner */}
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${cfg.color}`}>
              <StatusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">Application Status</p>
                <p className="text-base font-bold">{cfg.label}</p>
              </div>
              <span className="ml-auto shrink-0 rounded-lg bg-white/60 px-2.5 py-1 text-[11px] font-bold tracking-wide">
                {result.referenceNumber}
              </span>
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Applicant', result.fullName],
                ['Program', result.programLabel],
                ['Intake year', result.intakeYear],
                ['Submitted', result.submittedAt ? new Date(result.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
                ['Reviewed', result.reviewedAt ? new Date(result.reviewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not yet reviewed'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--color-soft-gray)]/40 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)] break-words">{value}</p>
                </div>
              ))}
            </div>

            {/* Feedback from admin */}
            {result.reviewFeedback && (
              <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--gold)] mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  Message from school
                </p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{result.reviewFeedback}</p>
              </div>
            )}

            {/* Admin attachment download */}
            {result.hasAdminAttachment && (
              <a
                href={getAdminAttachmentUrl(result.referenceNumber, result.attachmentToken)}
                download={result.adminAttachmentName || 'school-attachment'}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/8 px-4 py-3 text-sm font-semibold text-[var(--gold)] hover:bg-[var(--gold)]/15 transition-colors"
              >
                <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
                {result.adminAttachmentName || 'Download school attachment'}
              </a>
            )}

            {/* Status-specific guidance */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--color-soft-gray)]/30 px-4 py-3 text-sm text-[var(--text-secondary)]">
              {result.status === 'new' && 'Your application has been received. We will begin reviewing it shortly.'}
              {result.status === 'reviewed' && 'Your application is being reviewed by our admissions team. You will be notified once a decision is made.'}
              {result.status === 'accepted' && 'Congratulations! Your application has been accepted. Please check your email for further instructions.'}
              {result.status === 'declined' && 'We regret to inform you that your application was not successful at this time. Please contact us if you have questions.'}
            </div>

            <button
              type="button"
              onClick={() => { setResult(null); setQuery(''); }}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-2"
            >
              Search again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── File reader helper ────────────────────────────────────────────────────────
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

function formatRequestError(error) {
  const details = (error?.errors || []).map((item) => item.message || item.field).filter(Boolean);
  return details.length ? `${error.message}: ${details.join(' ')}` : error.message;
}

export default function Admissions() {
  const contentVersion = useContentVersion();
  useSiteImageVersion();
  const [programs, setPrograms] = useState([]);
  const contact = getContactInfo();
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
  const [activeStep, setActiveStep] = useState(1);
  const selectedProgram = programs.find((program) => program.slug === form.program);
  const resetForm = () => {
    setForm({ fullName: '', email: '', phone: '', program: '', dateOfBirth: '', gender: '', educationLevel: '', district: '', previousSchool: '', guardianName: '', guardianPhone: '', guardianRelationship: '', emergencyContactName: '', emergencyContactPhone: '', intakeYear: String(CURRENT_YEAR), message: '', privacyConsent: false, applicantPhoto: '', supportingDocument: '' });
    setErrors({});
    setServerError('');
    setSubmitted(false);
    setApplicationReference('');
    setActiveStep(1);
  };

  useEffect(() => {
    Promise.all([getPrograms(), getAdmissionsInfo()]).then(([nextPrograms, nextInfo]) => {
      setPrograms(nextPrograms);
      setInfo(nextInfo);
    }).catch((error) => setServerError(error.message));
  }, [contentVersion]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validationErrors = () => {
    const next = {};
    REQUIRED_FIELDS.forEach((f) => {
      if (!form[f]?.trim()) next[f] = 'This field is required.';
    });
    if (form.email && !EMAIL_PATTERN.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.email.length > 160) next.email = 'Email must be 160 characters or fewer.';
    // Letters-only names, letters+numbers school name, and 11–12 digit phone numbers.
    applyKindErrors(next, form, {
      fullName: 'name', district: 'name', previousSchool: 'alnum',
      guardianName: 'name', guardianRelationship: 'name', emergencyContactName: 'name',
      phone: 'phone', guardianPhone: 'phone', emergencyContactPhone: 'phone',
    });
    if (form.fullName.length > 120) next.fullName = 'Name must be 120 characters or fewer.';
    if (form.phone.length > 40) next.phone = 'Phone must be 40 characters or fewer.';
    if (form.district.length > 100) next.district = 'District must be 100 characters or fewer.';
    if (form.previousSchool.length > 160) next.previousSchool = 'Previous school must be 160 characters or fewer.';
    if (form.guardianName.length > 120) next.guardianName = 'Guardian name must be 120 characters or fewer.';
    if (form.guardianPhone.length > 40) next.guardianPhone = 'Phone must be 40 characters or fewer.';
    if (form.guardianRelationship.length > 60) next.guardianRelationship = 'Relationship must be 60 characters or fewer.';
    if (form.emergencyContactName.length > 120) next.emergencyContactName = 'Name must be 120 characters or fewer.';
    if (form.emergencyContactPhone.length > 40) next.emergencyContactPhone = 'Phone must be 40 characters or fewer.';
    if (form.message.length > 3000) next.message = 'Message must be 3,000 characters or fewer.';
    if (form.dateOfBirth && new Date(form.dateOfBirth) > new Date()) next.dateOfBirth = 'Date of birth cannot be in the future.';
    if (form.intakeYear && Number(form.intakeYear) !== CURRENT_YEAR) next.intakeYear = `Enter the active intake year: ${CURRENT_YEAR}.`;
    if (form.program && !programs.some((program) => program.slug === form.program)) next.program = 'Select a valid program.';
    if (!form.privacyConsent) next.privacyConsent = 'Please accept the privacy notice to continue.';
    return next;
  };

  const validateStep = (step) => {
    const allErrors = validationErrors();
    const fields = STEPS.find((item) => item.number === step)?.fields || [];
    const stepErrors = Object.fromEntries(Object.entries(allErrors).filter(([field]) => fields.includes(field)));
    setErrors((current) => ({ ...current, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  };

  const validate = () => {
    const next = validationErrors();
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (validateStep(activeStep)) setActiveStep((step) => Math.min(step + 1, STEPS.length));
  };

  const goBack = () => {
    setActiveStep((step) => Math.max(step - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstError = Object.keys(validationErrors())[0];
      const errorStep = STEPS.find((step) => step.fields.includes(firstError))?.number;
      if (errorStep) setActiveStep(errorStep);
      return;
    }
    const program = programs.find((p) => p.slug === form.program);
    setSaving(true);
    setServerError('');
    try {
      const application = await submitApplication({ ...form, programLabel: program?.title });
    setApplicationReference(application.referenceNumber || application._id || application.id || 'Submitted');
      setSubmitted(true);
    } catch (error) {
      setServerError(formatRequestError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: #FFFFFF !important; color-scheme: light !important; }
          body { height: 0 !important; overflow: visible !important; }
          #root { height: 0 !important; overflow: visible !important; }
          body * { visibility: hidden !important; }
          .admission-print-card,
          .admission-print-card * { visibility: visible !important; }
          .admission-print-card {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            padding: 0 !important;
            color: #173B31 !important;
            background: #FFFFFF !important;
          }
          .admission-print-card .print\\:hidden { display: none !important; visibility: hidden !important; }
          .admission-print-card .mb-8 { margin-bottom: 1rem !important; }
          .admission-print-card .py-12 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .admission-print-card .mt-7 { margin-top: 0.75rem !important; }
          .admission-print-card .mt-6 { margin-top: 0.75rem !important; }
          .admission-print-card .mt-5 { margin-top: 0.6rem !important; }
        }
      `}</style>
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

      <TrackApplicationSection />

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
                <a href={`tel:${contact.phone.replace(/\D/g, '')}`} className="flex items-center gap-2.5 text-sm font-medium text-[var(--gold)] hover:text-[var(--gold-hover)] transition-colors">
                  <Phone className="w-4 h-4" />
                  {contact.phone}
                </a>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-sm font-medium text-[var(--gold)] hover:text-[var(--gold-hover)] transition-colors">
                  <Mail className="w-4 h-4" />
                  {contact.email}
                </a>
              </div>
            </div>
            </div>

          <div id="application-form" className="border border-[var(--border)] shadow-[0_20px_45px_rgba(23,59,49,0.10)] rounded-[28px] p-5 sm:p-8 bg-[var(--surface)]">
            {submitted ? (
            <div className="admission-print-card text-center py-12">
              <div className="mb-8 flex flex-col items-center border-b border-[var(--border)] pb-6">
                <BrandMark containerClassName="h-16 w-16 rounded-2xl" imgClassName="p-1" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">Rambura Garçons TVET School</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Admissions confirmation</p>
              </div>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(15,108,255,0.10)] mb-4">
                <CheckCircle2 className="w-7 h-7 text-[var(--success)]" aria-hidden="true" />
              </div>
              <p className="font-display font-semibold text-lg text-[var(--text-primary)]">Application Submitted Successfully!</p>
              <p className="mt-3 inline-flex rounded-lg border border-[var(--border)] bg-[var(--color-soft-gray)] px-3 py-2 text-sm font-semibold tracking-wide text-[var(--gold)]">
                Reference: {applicationReference}
              </p>
              <div className="mx-auto mt-7 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
                {[
                  ['Applicant', form.fullName],
                  ['Email', form.email],
                  ['Phone', form.phone],
                  ['Program', selectedProgram?.title || form.program],
                  ['Intake year', form.intakeYear],
                  ['Submitted', new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--color-soft-gray)]/45 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">{label}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-[var(--text-secondary)]">Keep this confirmation and your reference number for future admissions follow-up.</p>
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
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]"><ShieldCheck className="h-4 w-4 text-[var(--success)]" /> Your progress is saved while you move between steps.</p>
                <span className="block w-12 h-1 rounded-full bg-[var(--gold)] mt-3" aria-hidden="true" />
              </div>

              <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--color-soft-gray)]/40 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2" aria-label="Application progress">
                  {STEPS.map((step, index) => (
                    <div key={step.number} className="flex min-w-0 flex-1 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => step.number < activeStep && setActiveStep(step.number)}
                        aria-current={activeStep === step.number ? 'step' : undefined}
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${activeStep >= step.number ? 'bg-[var(--color-deep-green)] text-white' : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]'} ${step.number < activeStep ? 'cursor-pointer hover:bg-[var(--gold)]' : 'cursor-default'}`}
                      >
                        {step.number}
                      </button>
                      <span className={`hidden truncate text-xs font-semibold sm:block ${activeStep === step.number ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{step.label}</span>
                      {index < STEPS.length - 1 && <span className="mx-1 h-px flex-1 bg-[var(--border)]" aria-hidden="true" />}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[var(--text-secondary)]">Step {activeStep} of {STEPS.length}: <span className="font-semibold text-[var(--text-primary)]">{STEPS[activeStep - 1].label}</span></p>
              </div>
              
              <div className="space-y-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--color-soft-gray)]/25 px-4 sm:px-5">
                <details open className={`group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5 ${activeStep !== 1 ? 'hidden' : ''}`}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 font-display font-semibold text-[var(--text-primary)] text-base [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--gold)] text-white text-sm font-bold">1</span>
                    Personal Information
                    <span className="ml-auto text-xs font-medium text-[var(--text-secondary)] group-open:hidden">Open</span>
                  </summary>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input kind="name" icon={User} label="Full Name" placeholder="Your complete name" required maxLength={120} value={form.fullName} onChange={update('fullName')} error={errors.fullName} />
                    <Input kind="email" icon={Mail} label="Email Address" type="email" placeholder="your.email@example.com" required maxLength={160} value={form.email} onChange={update('email')} error={errors.email} />
                    <Input kind="phone" icon={Phone} label="Phone Number" placeholder="+250 xxx xxx xxx" required maxLength={40} value={form.phone} onChange={update('phone')} error={errors.phone} />
                    <Input label="Date of Birth" type="date" max={new Date().toISOString().slice(0, 10)} required value={form.dateOfBirth} onChange={update('dateOfBirth')} error={errors.dateOfBirth} />
                    <Select label="Gender" placeholder="Select gender" required value={form.gender} onChange={update('gender')} error={errors.gender} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} />
                    <Select label="Highest Education Level" placeholder="Select education level" required value={form.educationLevel} onChange={update('educationLevel')} error={errors.educationLevel} options={[{ value: 'ordinary-level', label: 'Ordinary Level (O-Level)' }, { value: 'advanced-level', label: 'Advanced Level (A-Level)' }]} />
                    <Input kind="name" label="District of Residence" placeholder="e.g. Nyabihu" required maxLength={100} value={form.district} onChange={update('district')} error={errors.district} />
                    <Input kind="alnum" label="Previous School" placeholder="Name of your previous school" maxLength={160} value={form.previousSchool} onChange={update('previousSchool')} error={errors.previousSchool} className="sm:col-span-2" />
                    <Input kind="digits" label="Intake Year" placeholder={String(CURRENT_YEAR)} required maxLength={4} value={form.intakeYear} onChange={update('intakeYear')} error={errors.intakeYear} />
                  </div>
                </details>

                <details open className={`group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5 ${activeStep !== 2 ? 'hidden' : ''}`}>
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

                <details open className={`group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5 ${activeStep !== 3 ? 'hidden' : ''}`}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 font-display font-semibold text-[var(--text-primary)] text-base [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--gold)] text-white text-sm font-bold">3</span>
                    Parent or Guardian
                    <span className="ml-auto text-xs font-medium text-[var(--text-secondary)] group-open:hidden">Open</span>
                  </summary>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input kind="name" label="Guardian Full Name" placeholder="Parent or guardian name" required maxLength={120} value={form.guardianName} onChange={update('guardianName')} error={errors.guardianName} />
                    <Input kind="phone" label="Guardian Phone Number" placeholder="+250 xxx xxx xxx" required maxLength={40} value={form.guardianPhone} onChange={update('guardianPhone')} error={errors.guardianPhone} />
                    <Input kind="name" label="Relationship" placeholder="e.g. Father, Mother, Guardian" required maxLength={60} value={form.guardianRelationship} onChange={update('guardianRelationship')} error={errors.guardianRelationship} />
                    <Input kind="name" label="Emergency Contact Name" placeholder="Alternative contact person" maxLength={120} value={form.emergencyContactName} onChange={update('emergencyContactName')} error={errors.emergencyContactName} />
                    <Input kind="phone" label="Emergency Contact Phone" placeholder="+250 xxx xxx xxx" maxLength={40} value={form.emergencyContactPhone} onChange={update('emergencyContactPhone')} error={errors.emergencyContactPhone} />
                  </div>
                </details>

                <details open className={`group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5 ${activeStep !== 4 ? 'hidden' : ''}`}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 font-display font-semibold text-[var(--text-primary)] text-base [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--gold)] text-white text-sm font-bold">4</span>
                    Your Motivation
                    <span className="ml-auto text-xs font-medium text-[var(--text-secondary)] group-open:hidden">Open</span>
                  </summary>
                  <div>
                    <Textarea label="Why do you want to join this program?" placeholder="Tell us briefly about your goals and interests." maxLength={3000} value={form.message} onChange={update('message')} rows={4} error={errors.message} />
                  </div>
                </details>

                <details open className={`group border-b border-[var(--border)] py-4 last:border-b-0 sm:py-5 ${activeStep !== 4 ? 'hidden' : ''}`}>
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
                            setErrors((current) => ({ ...current, [field]: '' }));
                            setForm((current) => ({ ...current, [field]: value }));
                          }).catch((error) => setErrors((current) => ({ ...current, [field]: error.message })));
                        }} />
                        {errors[field] && <span className="text-xs font-medium text-[var(--color-status-red)]" role="alert">{errors[field]}</span>}
                      </label>
                    ))}
                  </div>
                </details>

              </div>

              <label className={`flex items-start gap-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-secondary)] cursor-pointer ${activeStep !== 4 ? 'hidden' : ''}`}>
                <input type="checkbox" checked={form.privacyConsent} onChange={(e) => setForm((current) => ({ ...current, privacyConsent: e.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--gold)]" />
                <span>I confirm that the information provided is accurate and agree that Rambura Garçons School may use it to process this application.</span>
              </label>
              {errors.privacyConsent && activeStep === 4 && <p className="-mt-4 text-sm text-[var(--color-status-red)]">{errors.privacyConsent}</p>}

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  {activeStep > 1 && (
                    <Button type="button" variant="ghost" icon={ChevronLeft} onClick={goBack}>
                      Back
                    </Button>
                  )}
                  <button type="button" className="px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]" onClick={resetForm}>
                    Clear form
                  </button>
                </div>
                {activeStep < STEPS.length ? (
                  <Button type="button" variant="primary" className="w-full sm:w-auto" icon={ChevronRight} iconPosition="right" onClick={goNext}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" className="w-full sm:w-auto" icon={Send} iconPosition="right" loading={saving} disabled={saving}>
                    {saving ? 'Submitting...' : 'Submit Application'}
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
        </div>
      </section>
    </div>
  );
}
