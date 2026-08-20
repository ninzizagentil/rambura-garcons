import { useState } from 'react';
import { MapPin, Phone, Mail, CheckCircle2, User, MessageSquare, Send } from 'lucide-react';
import { Input, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import PageHero from '../../components/common/PageHero';
import { getContactInfo } from '../../services/contentService';

export default function Contact() {
  const info = getContactInfo();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    ['name', 'email', 'subject', 'message'].forEach((f) => {
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
      <PageHero title="Contact Us">
        <p className="text-white/80 mt-3">We'd love to hear from you.</p>
      </PageHero>

      <section className="max-w-5xl mx-auto px-4 md:px-6 py-14 grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[var(--color-medium-green)] mt-0.5" aria-hidden="true" />
            <p className="text-sm text-[var(--color-dark-gray)]">{info.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[var(--color-medium-green)]" aria-hidden="true" />
            <p className="text-sm text-[var(--color-dark-gray)]">{info.phone}</p>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[var(--color-medium-green)]" aria-hidden="true" />
            <p className="text-sm text-[var(--color-dark-gray)]">{info.email}</p>
          </div>
          <div className="aspect-video rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border-gray)]">
            <iframe
              title="Rambura Garçons location map"
              src={`https://www.google.com/maps?q=${info.mapQuery}&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="bg-gradient-to-b from-[var(--color-navy-800)] to-[var(--color-navy-900)] border border-white/10 shadow-xl rounded-2xl p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-[var(--color-gold)] mx-auto mb-3" aria-hidden="true" />
              <p className="font-display font-semibold text-white">Message sent</p>
              <p className="text-sm text-white/70 mt-1">Thank you, {form.name.split(' ')[0]}. We'll respond within 2 business days.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Send a Message</h2>
                <span className="block w-10 h-1 rounded-full bg-[var(--color-gold)] mt-2" aria-hidden="true" />
              </div>
              <Input dark icon={User} label="Name" required value={form.name} onChange={update('name')} error={errors.name} />
              <Input dark icon={Mail} label="Email" type="email" required value={form.email} onChange={update('email')} error={errors.email} />
              <Input dark icon={MessageSquare} label="Subject" required value={form.subject} onChange={update('subject')} error={errors.subject} />
              <Textarea dark label="Message" required rows={5} value={form.message} onChange={update('message')} error={errors.message} />
              <Button type="submit" variant="gold" className="w-full" icon={Send} iconPosition="right">Submit</Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
