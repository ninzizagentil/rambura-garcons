import { useState } from 'react';
import { MapPin, Phone, Mail, CheckCircle2, User, MessageSquare, Send } from 'lucide-react';
import { Input, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import PageHero from '../../components/common/PageHero';
import { getContactInfo, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';

export default function Contact() {
  useContentVersion();
  useSiteImageVersion();
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
      <PageHero title="Contact Us" image={getSiteImage('pageHeroes.contact')}>
        <p className="text-[var(--text-secondary)] mt-3">We'd love to hear from you.</p>
      </PageHero>

      <section className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-3">
            Get in Touch
          </h2>
          <p className="text-[var(--text-secondary)] text-lg">We're here to answer any questions you may have</p>
          <span className="block w-16 h-1.5 rounded-full bg-[var(--gold)] mt-4" aria-hidden="true" />
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-[var(--gold)]">##</span> Contact Information
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Reach out to us directly</p>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.1)]">
              <div className="flex items-start gap-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(15,108,255,0.10)] flex-shrink-0 mt-1">
                  <MapPin className="w-5 h-5 text-[var(--gold)]" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">Location</h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{info.address}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(15,108,255,0.10)] flex-shrink-0">
                  <Phone className="w-5 h-5 text-[var(--gold)]" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">Phone</h4>
                  <a href={`tel:${info.phone.replace(/\D/g, '')}`} className="text-sm text-[var(--gold)] hover:text-[var(--gold-hover)] transition-colors font-medium">
                    {info.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(15,108,255,0.10)] flex-shrink-0">
                  <Mail className="w-5 h-5 text-[var(--gold)]" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">Email</h4>
                  <a href={`mailto:${info.email}`} className="text-sm text-[var(--gold)] hover:text-[var(--gold-hover)] transition-colors font-medium">
                    {info.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[var(--border)] shadow-[0_12px_28px_rgba(0,0,0,0.1)] aspect-video">
              <iframe
                title="Rambura Garçons location map"
                src={`https://www.google.com/maps?q=${info.mapQuery}&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="border border-[var(--border)] shadow-[0_20px_45px_rgba(0,0,0,0.12)] rounded-[28px] p-6 sm:p-8 bg-[var(--surface)] backdrop-blur-sm sticky top-20">
            {submitted ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(15,108,255,0.10)] mb-4">
                  <CheckCircle2 className="w-7 h-7 text-[var(--success)]" aria-hidden="true" />
                </div>
                <p className="font-display font-semibold text-lg text-[var(--text-primary)]">Message Sent Successfully!</p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  Thank you, <span className="font-semibold">{form.name.split(' ')[0]}</span>. We'll review your message and get back to you within <span className="font-semibold">2 business days</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', subject: '', message: '' });
                    setErrors({});
                  }}
                  className="mt-4 text-sm font-medium text-[var(--gold)] hover:text-[var(--gold-hover)] transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">Send us a Message</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Fill in your details and we'll get back to you soon.</p>
                  <span className="block w-12 h-1 rounded-full bg-[var(--gold)] mt-3" aria-hidden="true" />
                </div>

                <div className="space-y-4">
                  <Input 
                    icon={User} 
                    label="Full Name" 
                    placeholder="Your name" 
                    required 
                    value={form.name} 
                    onChange={update('name')} 
                    error={errors.name} 
                  />
                  <Input 
                    icon={Mail} 
                    label="Email Address" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    required 
                    value={form.email} 
                    onChange={update('email')} 
                    error={errors.email} 
                  />
                  <Input 
                    icon={MessageSquare} 
                    label="Subject" 
                    placeholder="What is this about?" 
                    required 
                    value={form.subject} 
                    onChange={update('subject')} 
                    error={errors.subject} 
                  />
                </div>

                <div>
                  <Textarea 
                    label="Message" 
                    placeholder="Tell us more about your inquiry..." 
                    required 
                    rows={4}
                    value={form.message} 
                    onChange={update('message')} 
                    error={errors.message} 
                  />
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                  <Button 
                    type="submit" 
                    variant="gold" 
                    className="flex-1" 
                    icon={Send} 
                    iconPosition="right"
                  >
                    Send Message
                  </Button>
                  <button
                    type="reset"
                    onClick={() => {
                      setForm({ name: '', email: '', subject: '', message: '' });
                      setErrors({});
                    }}
                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2.5"
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
