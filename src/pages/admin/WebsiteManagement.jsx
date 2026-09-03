import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Pencil, Trash2, Plus, Save, ExternalLink, History, RotateCcw, ImageOff,
  LayoutPanelTop, GraduationCap, Building2, Users, Newspaper, Images, CalendarDays,
  ClipboardList, Phone, ImageIcon, ChevronRight,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import HillRidgeDivider from '../../components/common/HillRidgeDivider';
import DataTable from '../../components/tables/DataTable';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import Modal from '../../components/modals/Modal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { Input, Textarea } from '../../components/forms/FormField';
import ImageField from '../../components/forms/ImageField';
import { EmptyState } from '../../components/feedback/States';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getActivity, logActivity, useActivityVersion } from '../../services/activityService';
import { getSiteImageSlots, updateSiteImage, resetSiteImage, useSiteImageVersion } from '../../services/imageService';
import { getActivityStatus, timeAgo } from '../../utils/activityStatus';
import { cn } from '../../utils/cn';
import {
  getHero, updateHero,
  getPrograms, createProgram, updateProgram, deleteProgram,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getStaff, createStaffMember, updateStaffMember, deleteStaffMember,
  getNews, createNewsArticle, updateNewsArticle, deleteNewsArticle,
  getGallery, createGalleryImage, updateGalleryImage, deleteGalleryImage,
  getAdmissionsInfo, updateAdmissionsInfo,
  getContactInfo, updateContactInfo,
  useContentVersion,
} from '../../services/contentService';

/**
 * Section metadata for the interactive card switcher below. Grouped into
 * three plain-language clusters so admins can scan for what they want
 * instead of parsing a flat tab strip. `count` is resolved at render time
 * from live data so each card always reflects what's actually on the site.
 */
const SECTION_GROUPS = [
  {
    group: 'Homepage Content',
    blurb: 'What visitors see first',
    sections: [
      { value: 'hero', label: 'Home Hero', icon: LayoutPanelTop, description: 'Banner heading, intro & stat bar' },
      { value: 'admissions', label: 'Admissions', icon: ClipboardList, description: 'Requirements, dates & process' },
      { value: 'contact', label: 'Contact', icon: Phone, description: 'Address, phone, email & map' },
    ],
  },
  {
    group: 'Pages & Listings',
    blurb: 'Programs, people & stories',
    sections: [
      { value: 'programs', label: 'Programs', icon: GraduationCap, description: 'Academic programs offered', countKey: 'programs' },
      { value: 'departments', label: 'Departments', icon: Building2, description: 'School departments & heads', countKey: 'departments' },
      { value: 'staff', label: 'Staff', icon: Users, description: 'Staff directory & bios', countKey: 'staff' },
      { value: 'news', label: 'News', icon: Newspaper, description: 'Announcements & articles', countKey: 'news' },
    ],
  },
  {
    group: 'Media & Gallery',
    blurb: 'Photos across the site',
    sections: [
      { value: 'gallery', label: 'Gallery', icon: Images, description: 'Public photo gallery grid', countKey: 'gallery' },
      { value: 'images', label: 'Site Images', icon: ImageIcon, description: 'Hero & page background photos', countKey: 'images' },
    ],
  },
];

/** Flat lookup of every section by tab value — used to show a contextual
 * header (icon + title + description) above whichever panel is active. */
const ALL_SECTIONS = SECTION_GROUPS.flatMap((g) => g.sections);

/**
 * SectionSidebar — the primary navigation for Website Management: a vertical
 * stack of glass rows grouped by purpose, pinned to the left of the content
 * panel on wider screens. Below `lg`, it collapses into a horizontal
 * scrolling strip of pills grouped the same way, so the same structure holds
 * up on tablets and phones.
 */
function SectionSidebar({ active, onChange, counts }) {
  const Row = ({ s, compact = false }) => {
    const isActive = active === s.value;
    const count = s.countKey ? counts[s.countKey] : null;
    const Icon = s.icon;

    if (compact) {
      return (
        <button
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(s.value)}
          className={cn(
            'shrink-0 flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-full border backdrop-blur-xl transition-all duration-200',
            'focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2',
            isActive
              ? 'bg-[var(--sidebar-bg)] border-[var(--sidebar-border)] shadow-[0_6px_16px_rgba(0,0,0,0.08)]'
              : 'bg-[white] border-[var(--sidebar-border)] hover:bg-[var(--sidebar-nav-hover-bg)]'
          )}
        >
          <span
            className={cn(
              'inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0',
              isActive ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)]' : 'bg-[var(--color-soft-gray)] text-[var(--sidebar-text)]'
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className={cn('text-xs font-semibold whitespace-nowrap', isActive ? 'text-[var(--sidebar-text)]' : 'text-[var(--sidebar-text-secondary)]')}>
            {s.label}
          </span>
          {count !== null && count !== undefined && (
            <span className={cn('text-[10px] font-bold', isActive ? 'text-[var(--color-gold)]' : 'text-[var(--sidebar-text-secondary)]')}>
              {count}
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        aria-pressed={isActive}
        onClick={() => onChange(s.value)}
        className={cn(
          'group relative w-full flex items-center gap-3 text-left pl-3.5 pr-3 py-2.5 rounded-xl border backdrop-blur-xl transition-all duration-200 ease-out',
          'focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2',
          isActive
            ? 'bg-[var(--sidebar-bg)] border-[var(--sidebar-border)] shadow-[0_8px_20px_rgba(17,24,39,0.08)] translate-x-0.5'
            : 'bg-[var(--surface)] border-[var(--sidebar-border)] hover:bg-[var(--sidebar-nav-hover-bg)]'
        )}
      >
        <span
          className={cn(
            'absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full transition-colors',
            isActive ? 'bg-[var(--color-gold)]' : 'bg-transparent'
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors',
            isActive
              ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-text)]'
              : 'bg-[var(--color-soft-gray)] text-[var(--sidebar-text)] group-hover:bg-[var(--sidebar-nav-hover-bg)]'
          )}
        >
          <Icon className="w-4.5 h-4.5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block text-sm font-semibold truncate', isActive ? 'text-[var(--sidebar-text)]' : 'text-[var(--sidebar-text)]')}>
            {s.label}
          </span>
          <span className={cn('block text-[11px] leading-snug truncate', isActive ? 'text-[var(--sidebar-text-secondary)]' : 'text-[var(--sidebar-text-secondary)]')}>
            {s.description}
          </span>
        </span>
        {count !== null && count !== undefined && (
          <span
            className={cn(
              'text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0',
              isActive ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--color-gold)]' : 'bg-[var(--color-soft-gray)] text-[var(--sidebar-text-secondary)]'
            )}
          >
            {count}
          </span>
        )}
        <ChevronRight
          className={cn(
            'w-4 h-4 shrink-0 transition-all duration-200',
            isActive ? 'text-[var(--color-gold)] opacity-100' : 'text-[var(--sidebar-text-secondary)] opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0'
          )}
          aria-hidden="true"
        />
      </button>
    );
  };

  return (
    <nav
      aria-label="Website content sections"
      className="relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--sidebar-bg)] w-full lg:w-72 shrink-0 lg:sticky lg:top-6 border border-[var(--sidebar-border)]"
    >
      {/* Ambient glow blobs so the glass rows have something to blur against */}
      <div className="pointer-events-none absolute -top-14 -right-10 w-48 h-48 rounded-full bg-[var(--color-soft-gray)] opacity-70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-[var(--color-gold)] opacity-10 blur-3xl" aria-hidden="true" />

      {/* ≥lg: full vertical menu, grouped with headings */}
      <div className="hidden lg:block relative p-4 max-h-[calc(100vh-3rem)] overflow-y-auto">
        {SECTION_GROUPS.map((grp, i) => (
          <div key={grp.group} className={i > 0 ? 'mt-5 pt-5 border-t border-[rgba(255,255,255,0.10)]' : ''}>
            <p className="px-1 mb-2 font-display text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--color-gold)]">
              {grp.group}
            </p>
            <div className="space-y-1.5">
              {grp.sections.map((s) => <Row key={s.value} s={s} />)}
            </div>
          </div>
        ))}
      </div>

      {/* <lg: compact horizontal scroller, same grouping, chip-style rows */}
      <div className="lg:hidden relative p-4 space-y-3">
        {SECTION_GROUPS.map((grp) => (
          <div key={grp.group}>
            <p className="mb-1.5 font-display text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--color-gold)]">
              {grp.group}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {grp.sections.map((s) => <Row key={s.value} s={s} compact />)}
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none opacity-[0.08] -mt-1" aria-hidden="true">
        <HillRidgeDivider tone="light" />
      </div>
    </nav>
  );
}

/** Turns a list of strings into one line-per-item textarea value, and back. */
const toLines = (arr) => (arr || []).join('\n');
const fromLines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

/* ───────────────────────── generic list editor modal ───────────────────────── */
/** fields: [{ key, label, type: 'text'|'textarea', required?, rows?, hint? }] */
function EntityFormModal({ open, onClose, title, fields, initial, onSubmit }) {
  const [values, setValues] = useState(initial || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const missing = fields.find((f) => f.required && !String(values[f.key] ?? '').trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    setSaving(true);
    const result = await onSubmit(values);
    setSaving(false);
    if (result && result.success === false) {
      setError(result.error || 'Something went wrong.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <p className="text-sm font-medium text-[var(--color-status-red)]">{error}</p>}
        {fields.map((f) =>
          f.type === 'textarea' ? (
            <Textarea
              key={f.key}
              label={f.label}
              required={f.required}
              rows={f.rows || 3}
              value={values[f.key] ?? ''}
              onChange={set(f.key)}
              hint={f.hint}
            />
          ) : f.type === 'image' ? (
            <ImageField
              key={f.key}
              label={f.label}
              required={f.required}
              value={values[f.key] ?? ''}
              onChange={(dataUrl) => setValues((v) => ({ ...v, [f.key]: dataUrl }))}
              hint={f.hint}
            />
          ) : (
            <Input
              key={f.key}
              label={f.label}
              type={f.type || 'text'}
              required={f.required}
              icon={f.icon}
              value={values[f.key] ?? ''}
              onChange={set(f.key)}
              hint={f.hint}
            />
          )
        )}
        <div className="flex gap-3 pt-1">
          <Button type="submit" variant="primary" loading={saving} className="flex-1">Save</Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

/** Small photo preview shown in admin tables, so it's obvious which picture each row uses. */
function Thumb({ src, alt, round = false }) {
  if (!src) {
    return (
      <span className="flex items-center justify-center w-12 h-12 rounded-md bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)]">
        <ImageOff className="w-4 h-4" aria-hidden="true" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`w-12 h-12 object-cover ${round ? 'rounded-full' : 'rounded-md'}`}
      loading="lazy"
    />
  );
}

/**
 * SiteImagesPanel — edits the "fixed" photos that belong to a page rather
 * than to a list item: the Home hero + preview strip, the About page's
 * campus/leadership/facility photos, and the Admissions banner.
 * (Programs, Departments, Staff, News, and Gallery photos are edited
 * directly on their own tab, right alongside that item's text.)
 */
function SiteImagesPanel({ user, notify, notifyError, bumpActivity }) {
  const imageVersion = useSiteImageVersion();
  const [slots, setSlots] = useState(getSiteImageSlots());
  const [drafts, setDrafts] = useState({});
  const [savingPath, setSavingPath] = useState(null);

  const refresh = () => setSlots(getSiteImageSlots());

  // Site image overrides load asynchronously (refreshSiteImages() at module
  // init). Re-pull whenever the cache changes so a still-loading or
  // just-edited-elsewhere set of custom photos shows up here reliably.
  useEffect(() => { refresh(); }, [imageVersion]);
  const draftFor = (path, fallback) => (drafts[path] ?? fallback);

  const handleSave = async (path) => {
    const url = drafts[path];
    setSavingPath(path);
    const result = await updateSiteImage(path, url, user);
    setSavingPath(null);
    if (result.success) {
      refresh();
      setDrafts((d) => { const next = { ...d }; delete next[path]; return next; });
      notify('Image updated.');
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };

  const handleReset = async (path) => {
    const result = await resetSiteImage(path, user);
    if (!result.success) { notifyError(result.error); return; }
    refresh();
    setDrafts((d) => { const next = { ...d }; delete next[path]; return next; });
    notify('Image reset to the default photo.');
    bumpActivity();
  };

  const groups = slots.reduce((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-8">
      <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)] max-w-2xl">
        These are the page photos that aren't tied to a specific Program, Department, Staff member, News article, or
        Gallery item — browse for a new photo and save. "Reset" brings back the original photo.
      </p>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(17,58,48,0.04))] p-4">
          <p className="text-sm font-semibold text-[var(--color-dark-gray)] mb-3">{group}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((slot) => (
              <div key={slot.path} className="border border-[var(--color-border-gray)] rounded-[var(--radius-card)] bg-[var(--color-soft-gray)] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.04)]">
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-md overflow-hidden shrink-0 bg-[var(--color-soft-gray)]">
                    <img src={slot.url} alt={slot.label} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-dark-gray)]">{slot.label}</p>
                    {slot.isCustom && <Badge tone="gold" className="mt-1">Custom photo</Badge>}
                  </div>
                </div>
                <ImageField
                  className="mt-3"
                  label="Photo"
                  value={draftFor(slot.path, slot.url)}
                  onChange={(dataUrl) => setDrafts((d) => ({ ...d, [slot.path]: dataUrl }))}
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Save}
                    loading={savingPath === slot.path}
                    onClick={() => handleSave(slot.path)}
                  >
                    Save
                  </Button>
                  {slot.isCustom && (
                    <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => handleReset(slot.path)}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WebsiteManagement() {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [tab, setTab] = useState('hero');
  const contentVersion = useContentVersion();
  const activityVersion = useActivityVersion();

  // List collections — kept in state so the table re-renders instantly after edits.
  const [programs, setPrograms] = useState(getPrograms());
  const [departments, setDepartments] = useState(getDepartments());
  const [staff, setStaff] = useState(getStaff());
  const [news, setNews] = useState(getNews());
  const [gallery, setGallery] = useState(getGallery());
  const siteImageCount = useMemo(() => getSiteImageSlots().length, []);

  // Single-object content — Home Hero, Admissions, Contact.
  const [heroForm, setHeroForm] = useState(getHero());
  const [admissionsForm, setAdmissionsForm] = useState(() => {
    const a = getAdmissionsInfo();
    return { ...a, requirements: toLines(a.requirements), dates: toLines(a.dates) };
  });
  const [contactForm, setContactForm] = useState(getContactInfo());
  const [savingSingle, setSavingSingle] = useState(false);

  // These forms hold in-progress admin edits, so a background content-update
  // event (another admin's change, or the initial fetch finishing late)
  // must not stomp on text the user is actively typing. Each ref flips to
  // true the moment the admin edits that form, and back to false once their
  // own save lands — only then is it safe to resync from the cache again.
  const heroDirty = useRef(false);
  const admissionsDirty = useRef(false);
  const contactDirty = useRef(false);
  const editHero = (updater) => { heroDirty.current = true; setHeroForm(updater); };
  const editAdmissions = (updater) => { admissionsDirty.current = true; setAdmissionsForm(updater); };
  const editContact = (updater) => { contactDirty.current = true; setContactForm(updater); };

  // The list/table data and the three single-object forms above all read
  // from contentService's in-memory cache, which fills in asynchronously
  // (see useContentVersion in contentService.js). Re-pull everything here
  // whenever that cache changes — on the initial load once it resolves, and
  // after any create/update/delete anywhere (including another admin's).
  useEffect(() => {
    setPrograms(getPrograms());
    setDepartments(getDepartments());
    setStaff(getStaff());
    setNews(getNews());
    setGallery(getGallery());
    if (!heroDirty.current) setHeroForm(getHero());
    if (!admissionsDirty.current) {
      const a = getAdmissionsInfo();
      setAdmissionsForm({ ...a, requirements: toLines(a.requirements), dates: toLines(a.dates) });
    }
    if (!contactDirty.current) setContactForm(getContactInfo());
  }, [contentVersion]);

  // Modal state shared by every list tab.
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', item: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const recentActivity = useMemo(
    () => getActivity().filter((a) => a.module === 'Website').slice(0, 6),
    [refreshTick, activityVersion]
  );
  const bumpActivity = () => setRefreshTick((n) => n + 1);
  const recordWebsiteAction = (action, status = 'success') => {
    logActivity({
      user: user?.fullName || user?.username || 'Admin',
      action,
      module: 'Website',
      status,
    });
  };

  const notify = (msg) => showToast(msg, 'success');
  const notifyError = (msg) => showToast(msg, 'error');

  /* ── Home Hero ───────────────────────────────────────────────────── */
  const saveHero = async (e) => {
    e.preventDefault();
    setSavingSingle(true);
    const result = await updateHero(heroForm, user);
    setSavingSingle(false);
    if (result.success) {
      heroDirty.current = false;
      setHeroForm(result.hero);
      recordWebsiteAction('Updated the Home Hero section');
      notify('Homepage hero content saved.');
      addNotification({
        type: 'website',
        message: 'Home Hero section has been updated.',
        to: '/admin/website',
      });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };
  const setStat = (i, field) => (e) => {
    editHero((h) => {
      const stats = [...h.stats];
      stats[i] = { ...stats[i], [field]: e.target.value };
      return { ...h, stats };
    });
  };

  /* ── Programs ────────────────────────────────────────────────────── */
  const programFields = [
    { key: 'title', label: 'Program Title', required: true },
    { key: 'level', label: 'Level', required: true },
    { key: 'duration', label: 'Duration', required: true },
    { key: 'summary', label: 'Short Summary (shown on cards)', type: 'textarea', required: true },
    { key: 'details', label: 'Full Details (shown when a visitor clicks "Learn More")', type: 'textarea', rows: 4, required: true },
    { key: 'image', label: 'Photo', type: 'image', required: true, hint: 'Shown on the Academics page card for this program.' },
  ];
  const openAddProgram = () => setFormModal({ open: true, mode: 'add', item: {} });
  const openEditProgram = (p) => setFormModal({ open: true, mode: 'edit', item: p });
  const submitProgram = async (values) => {
    const result = formModal.mode === 'add'
      ? createProgram(values, user)
      : updateProgram(formModal.item.id, values, user);
    const resolved = await result;
    if (resolved.success) {
      setPrograms(getPrograms());
      setFormModal({ open: false, mode: 'add', item: null });
      recordWebsiteAction(formModal.mode === 'add' ? 'Added a new program' : 'Updated a program');
      notify(formModal.mode === 'add' ? 'Program added.' : 'Program updated.');
      addNotification({
        type: 'website',
        message: formModal.mode === 'add' ? `Program "${values.title}" has been added.` : `Program "${values.title}" has been updated.`,
        to: '/admin/website',
      });
      bumpActivity();
    } else {
      notifyError(resolved.error);
    }
    return resolved;
  };
  const confirmDeleteProgram = async () => {
    await deleteProgram(deleteTarget.id, user);
    setPrograms(getPrograms());
    setDeleteTarget(null);
    recordWebsiteAction('Deleted a program');
    notify('Program deleted.');
    addNotification({
      type: 'website',
      message: `Program "${deleteTarget.title}" has been deleted.`,
      to: '/admin/website',
    });
    bumpActivity();
  };

  /* ── Departments ─────────────────────────────────────────────────── */
  const departmentFields = [
    { key: 'name', label: 'Department Name', required: true },
    { key: 'head', label: 'Head of Department', required: true },
    { key: 'staffCount', label: 'Staff Count', required: true },
    { key: 'image', label: 'Photo', type: 'image', required: true, hint: 'Shown on the Departments page card.' },
  ];
  const openAddDepartment = () => setFormModal({ open: true, mode: 'add', item: {} });
  const openEditDepartment = (d) => setFormModal({ open: true, mode: 'edit', item: d });
  const submitDepartment = async (values) => {
    const payload = { ...values, staffCount: Number(values.staffCount) || 0 };
    const result = formModal.mode === 'add'
      ? createDepartment(payload, user)
      : updateDepartment(formModal.item.id, payload, user);
    const resolved = await result;
    if (resolved.success) {
      setDepartments(getDepartments());
      setFormModal({ open: false, mode: 'add', item: null });
      recordWebsiteAction(formModal.mode === 'add' ? 'Added a department' : 'Updated a department');
      notify(formModal.mode === 'add' ? 'Department added.' : 'Department updated.');
      addNotification({
        type: 'website',
        message: formModal.mode === 'add' ? `Department "${values.name}" has been added.` : `Department "${values.name}" has been updated.`,
        to: '/admin/website',
      });
      bumpActivity();
    } else {
      notifyError(resolved.error);
    }
    return resolved;
  };
  const confirmDeleteDepartment = async () => {
    await deleteDepartment(deleteTarget.id, user);
    setDepartments(getDepartments());
    setDeleteTarget(null);
    recordWebsiteAction('Deleted a department');
    notify('Department deleted.');
    addNotification({
      type: 'website',
      message: `Department "${deleteTarget.name}" has been deleted.`,
      to: '/admin/website',
    });
    bumpActivity();
  };

  /* ── Staff ───────────────────────────────────────────────────────── */
  const staffFields = [
    { key: 'name', label: 'Full Name', required: true },
    { key: 'role', label: 'Role / Title', required: true },
    { key: 'department', label: 'Department', required: true },
    { key: 'bio', label: 'Short Bio', type: 'textarea', required: true },
    { key: 'photo', label: 'Photo', type: 'image', required: true, hint: 'Shown on the Staff page.' },
  ];
  const openAddStaff = () => setFormModal({ open: true, mode: 'add', item: {} });
  const openEditStaff = (s) => setFormModal({ open: true, mode: 'edit', item: s });
  const submitStaff = async (values) => {
    const result = formModal.mode === 'add'
      ? createStaffMember(values, user)
      : updateStaffMember(formModal.item.id, values, user);
    const resolved = await result;
    if (resolved.success) {
      setStaff(getStaff());
      setFormModal({ open: false, mode: 'add', item: null });
      recordWebsiteAction(formModal.mode === 'add' ? 'Added a staff member' : 'Updated a staff member');
      notify(formModal.mode === 'add' ? 'Staff member added.' : 'Staff member updated.');
      addNotification({
        type: 'website',
        message: formModal.mode === 'add' ? `Staff member "${values.name}" has been added.` : `Staff member "${values.name}" has been updated.`,
        to: '/admin/website',
      });
      bumpActivity();
    } else {
      notifyError(resolved.error);
    }
    return resolved;
  };
  const confirmDeleteStaff = async () => {
    await deleteStaffMember(deleteTarget.id, user);
    setStaff(getStaff());
    setDeleteTarget(null);
    recordWebsiteAction('Removed a staff member');
    notify('Staff member removed.');
    addNotification({
      type: 'website',
      message: `Staff member "${deleteTarget.name}" has been removed.`,
      to: '/admin/website',
    });
    bumpActivity();
  };

  /* ── News ────────────────────────────────────────────────────────── */
  const newsFields = [
    { key: 'title', label: 'Title', required: true },
    { key: 'date', label: 'Date', type: 'date', icon: CalendarDays, required: true },
    { key: 'excerpt', label: 'Short Excerpt (shown on News list)', type: 'textarea', required: true },
    { key: 'content', label: 'Full Article Content', type: 'textarea', rows: 6, required: true },
    { key: 'image', label: 'Photo', type: 'image', required: true, hint: 'Shown on the News list and the article page.' },
  ];
  const openAddNews = () => setFormModal({ open: true, mode: 'add', item: {} });
  const openEditNews = (n) => setFormModal({ open: true, mode: 'edit', item: n });
  const submitNews = async (values) => {
    const result = formModal.mode === 'add'
      ? createNewsArticle(values, user)
      : updateNewsArticle(formModal.item.id, values, user);
    const resolved = await result;
    if (resolved.success) {
      setNews(getNews());
      setFormModal({ open: false, mode: 'add', item: null });
      recordWebsiteAction(formModal.mode === 'add' ? 'Published a news article' : 'Updated a news article');
      notify(formModal.mode === 'add' ? 'Article published.' : 'Article updated.');
      addNotification({
        type: 'website',
        message: formModal.mode === 'add' ? `News article "${values.title}" has been published.` : `News article "${values.title}" has been updated.`,
        to: '/admin/website',
      });
      bumpActivity();
    } else {
      notifyError(resolved.error);
    }
    return resolved;
  };
  const confirmDeleteNews = async () => {
    await deleteNewsArticle(deleteTarget.id, user);
    setNews(getNews());
    setDeleteTarget(null);
    recordWebsiteAction('Deleted a news article');
    notify('Article deleted.');
    addNotification({
      type: 'website',
      message: `News article "${deleteTarget.title}" has been deleted.`,
      to: '/admin/website',
    });
    bumpActivity();
  };

  /* ── Gallery ─────────────────────────────────────────────────────── */
  const galleryFields = [
    { key: 'caption', label: 'Caption', required: true },
    { key: 'image', label: 'Photo', type: 'image', required: true, hint: 'The actual picture shown in the Gallery grid.' },
  ];
  const openAddGallery = () => setFormModal({ open: true, mode: 'add', item: {} });
  const openEditGallery = (g) => setFormModal({ open: true, mode: 'edit', item: g });
  const submitGallery = async (values) => {
    const result = formModal.mode === 'add'
      ? createGalleryImage(values, user)
      : updateGalleryImage(formModal.item.id, values, user);
    const resolved = await result;
    if (resolved.success) {
      setGallery(getGallery());
      setFormModal({ open: false, mode: 'add', item: null });
      recordWebsiteAction(formModal.mode === 'add' ? 'Added a gallery image' : 'Updated a gallery image');
      notify(formModal.mode === 'add' ? 'Image added.' : 'Caption updated.');
      addNotification({
        type: 'website',
        message: formModal.mode === 'add' ? `Gallery image "${values.caption}" has been added.` : `Gallery image caption has been updated.`,
        to: '/admin/website',
      });
      bumpActivity();
    } else {
      notifyError(resolved.error);
    }
    return resolved;
  };
  const confirmDeleteGallery = async () => {
    await deleteGalleryImage(deleteTarget.id, user);
    setGallery(getGallery());
    setDeleteTarget(null);
    recordWebsiteAction('Deleted a gallery image');
    notify('Image deleted.');
    addNotification({
      type: 'website',
      message: `Gallery image has been deleted.`,
      to: '/admin/website',
    });
    bumpActivity();
  };

  /* ── Admissions & Contact (single-object forms) ─────────────────── */
  const saveAdmissions = async (e) => {
    e.preventDefault();
    setSavingSingle(true);
    const result = await updateAdmissionsInfo(
      { ...admissionsForm, requirements: fromLines(admissionsForm.requirements), dates: fromLines(admissionsForm.dates) },
      user
    );
    setSavingSingle(false);
    if (result.success) {
      admissionsDirty.current = false;
      const a = getAdmissionsInfo();
      setAdmissionsForm({ ...a, requirements: toLines(a.requirements), dates: toLines(a.dates) });
      recordWebsiteAction('Updated the Admissions page');
      notify('Admissions page content saved.');
      addNotification({
        type: 'website',
        message: 'Admissions page has been updated.',
        to: '/admin/website',
      });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };
  const saveContact = async (e) => {
    e.preventDefault();
    setSavingSingle(true);
    const result = await updateContactInfo(contactForm, user);
    setSavingSingle(false);
    if (result.success) {
      contactDirty.current = false;
      setContactForm(getContactInfo());
      recordWebsiteAction('Updated the Contact information');
      notify('Contact page information saved.');
      addNotification({
        type: 'website',
        message: 'Contact page information has been updated.',
        to: '/admin/website',
      });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };

  /* ── Delete-confirm wiring per tab ──────────────────────────────── */
  const deleteHandlers = {
    programs: { confirm: confirmDeleteProgram, label: (t) => t?.title },
    departments: { confirm: confirmDeleteDepartment, label: (t) => t?.name },
    staff: { confirm: confirmDeleteStaff, label: (t) => t?.name },
    news: { confirm: confirmDeleteNews, label: (t) => t?.title },
    gallery: { confirm: confirmDeleteGallery, label: (t) => t?.caption },
  };

  const actionCol = (onEdit, labelKey) => ({
    key: 'actions',
    header: 'Actions',
    render: (row) => (
      <div className="flex items-center gap-1">
        <IconButton icon={Pencil} label={`Edit ${row[labelKey]}`} onClick={() => onEdit(row)} />
        <IconButton icon={Trash2} label={`Delete ${row[labelKey]}`} variant="danger" onClick={() => setDeleteTarget(row)} />
      </div>
    ),
  });

  /* ── Tab content ─────────────────────────────────────────────────── */
  const renderTab = () => {
    if (tab === 'hero') {
      return (
        <form onSubmit={saveHero} className="p-6 space-y-5 max-w-3xl">
          <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">
            This is the banner shown at the top of the public Home page — the eyebrow tag, main heading, intro
            paragraph, and the four stat numbers.
          </p>
          <Input label="Eyebrow tag" required value={heroForm.eyebrow} onChange={(e) => editHero((h) => ({ ...h, eyebrow: e.target.value }))} />
          <Input label="Main Heading" required value={heroForm.title} onChange={(e) => editHero((h) => ({ ...h, title: e.target.value }))} />
          <Textarea label="Intro Paragraph" required rows={3} value={heroForm.subtitle} onChange={(e) => editHero((h) => ({ ...h, subtitle: e.target.value }))} />
          <div>
            <p className="text-sm font-medium text-[var(--color-dark-gray)] mb-2">Stat Bar (4 numbers shown below the hero)</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {heroForm.stats.map((s, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Input label={`Value ${i + 1}`} value={s.value} onChange={setStat(i, 'value')} />
                  <Input label={`Label ${i + 1}`} value={s.label} onChange={setStat(i, 'label')} />
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save Hero Content</Button>
        </form>
      );
    }

    if (tab === 'programs') {
      return (
        <DataTable
          columns={[
            { key: 'image', header: 'Photo', render: (p) => <Thumb src={p.image} alt={p.title} /> },
            { key: 'title', header: 'Program' },
            { key: 'level', header: 'Level' },
            { key: 'duration', header: 'Duration' },
            actionCol(openEditProgram, 'title'),
          ]}
          data={programs}
          rowKey="slug"
          emptyState={<EmptyState title="No programs found" actionLabel="Add Program" onAction={openAddProgram} />}
        />
      );
    }

    if (tab === 'departments') {
      return (
        <DataTable
          columns={[
            { key: 'image', header: 'Photo', render: (d) => <Thumb src={d.image} alt={d.name} /> },
            { key: 'name', header: 'Department' },
            { key: 'head', header: 'Head' },
            { key: 'staffCount', header: 'Staff Count' },
            actionCol(openEditDepartment, 'name'),
          ]}
          data={departments}
          rowKey="slug"
          emptyState={<EmptyState title="No departments found" actionLabel="Add Department" onAction={openAddDepartment} />}
        />
      );
    }

    if (tab === 'staff') {
      return (
        <DataTable
          columns={[
            { key: 'photo', header: 'Photo', render: (s) => <Thumb src={s.photo} alt={s.name} round /> },
            { key: 'name', header: 'Name' },
            { key: 'role', header: 'Role' },
            { key: 'department', header: 'Department' },
            actionCol(openEditStaff, 'name'),
          ]}
          data={staff}
          emptyState={<EmptyState title="No staff found" actionLabel="Add Staff Member" onAction={openAddStaff} />}
        />
      );
    }

    if (tab === 'news') {
      return (
        <DataTable
          columns={[
            { key: 'image', header: 'Photo', render: (n) => <Thumb src={n.image} alt={n.title} /> },
            { key: 'title', header: 'Title' },
            { key: 'date', header: 'Date', render: (n) => new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
            actionCol(openEditNews, 'title'),
          ]}
          data={news}
          rowKey="slug"
          emptyState={<EmptyState title="No news articles" actionLabel="Add Article" onAction={openAddNews} />}
        />
      );
    }

    if (tab === 'gallery') {
      return (
        <DataTable
          columns={[
            { key: 'image', header: 'Photo', render: (g) => <Thumb src={g.image} alt={g.caption} /> },
            { key: 'caption', header: 'Caption' },
            actionCol(openEditGallery, 'caption'),
          ]}
          data={gallery}
          emptyState={<EmptyState title="No gallery images" actionLabel="Add Image" onAction={openAddGallery} />}
        />
      );
    }

    if (tab === 'admissions') {
      return (
        <form onSubmit={saveAdmissions} className="p-6 space-y-5 max-w-3xl">
          <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">
            Content shown on the public Admissions page: the intro line, requirements list, important dates, the
            process paragraph, and the contact line. For lists, put one item per line.
          </p>
          <Textarea label="Intro line" required value={admissionsForm.intro} onChange={(e) => editAdmissions((a) => ({ ...a, intro: e.target.value }))} />
          <Textarea label="Requirements (one per line)" required rows={5} value={admissionsForm.requirements} onChange={(e) => editAdmissions((a) => ({ ...a, requirements: e.target.value }))} />
          <Textarea label="Important Dates (one per line)" required rows={5} value={admissionsForm.dates} onChange={(e) => editAdmissions((a) => ({ ...a, dates: e.target.value }))} />
          <Textarea label="Admission Process paragraph" required rows={3} value={admissionsForm.process} onChange={(e) => editAdmissions((a) => ({ ...a, process: e.target.value }))} />
          <Input label="Contact line" required value={admissionsForm.contactLine} onChange={(e) => editAdmissions((a) => ({ ...a, contactLine: e.target.value }))} />
          <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save Admissions Content</Button>
        </form>
      );
    }

    if (tab === 'contact') {
      return (
        <form onSubmit={saveContact} className="p-6 space-y-5 max-w-3xl">
          <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">
            Address, phone, email, and map location shown on the public Contact page.
          </p>
          <Textarea label="Address" required value={contactForm.address} onChange={(e) => editContact((c) => ({ ...c, address: e.target.value }))} />
          <Input label="Phone" required value={contactForm.phone} onChange={(e) => editContact((c) => ({ ...c, phone: e.target.value }))} />
          <Input label="Email" required type="email" value={contactForm.email} onChange={(e) => editContact((c) => ({ ...c, email: e.target.value }))} />
          <Input label="Map search query" required value={contactForm.mapQuery} onChange={(e) => editContact((c) => ({ ...c, mapQuery: e.target.value }))} hint="Used to locate the school on the embedded Google Map." />
          <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save Contact Info</Button>
        </form>
      );
    }

    // images
    return <SiteImagesPanel user={user} notify={notify} notifyError={notifyError} bumpActivity={bumpActivity} />;
  };

  const isListTab = ['programs', 'departments', 'staff', 'news', 'gallery'].includes(tab);
  const currentSection = ALL_SECTIONS.find((s) => s.value === tab);
  const addHandlers = { programs: openAddProgram, departments: openAddDepartment, staff: openAddStaff, news: openAddNews, gallery: openAddGallery };
  const submitHandlers = { programs: submitProgram, departments: submitDepartment, staff: submitStaff, news: submitNews, gallery: submitGallery };
  const fieldSets = { programs: programFields, departments: departmentFields, staff: staffFields, news: newsFields, gallery: galleryFields };
  const modalTitles = {
    programs: formModal.mode === 'add' ? 'Add Program' : 'Edit Program',
    departments: formModal.mode === 'add' ? 'Add Department' : 'Edit Department',
    staff: formModal.mode === 'add' ? 'Add Staff Member' : 'Edit Staff Member',
    news: formModal.mode === 'add' ? 'Add News Article' : 'Edit News Article',
    gallery: formModal.mode === 'add' ? 'Add Gallery Image' : 'Edit Caption',
  };

  return (
    <div>
      <PageHeader
        title="Website Management"
        description="Manage every piece of content on the public website — changes here appear live on the site immediately."
        breadcrumb={[{ label: 'Admin', to: '/admin' }, { label: 'Website' }]}
        actions={
          <>
            <Link to="/admin/activity">
              <Button variant="secondary" icon={History}>All Website Activity</Button>
            </Link>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" icon={ExternalLink}>View Site</Button>
            </a>
            {isListTab && <Button icon={Plus} onClick={addHandlers[tab]}>Add</Button>}
          </>
        }
      />

      <div className="mt-5 flex flex-col lg:flex-row gap-5 items-start">
        <SectionSidebar
          active={tab}
          onChange={setTab}
          counts={{
            programs: programs.length,
            departments: departments.length,
            staff: staff.length,
            news: news.length,
            gallery: gallery.length,
            images: siteImageCount,
          }}
        />

        <div className="flex-1 min-w-0 w-full bg-[var(--surface)] rounded-[1.5rem] border border-[var(--border)] shadow-[0_20px_45px_rgba(15,23,42,0.06)] overflow-hidden">
          {currentSection && (
            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--sidebar-nav-hover-bg)]">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-text)] shrink-0 ring-1 ring-[var(--border)]">
                <currentSection.icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] truncate">
                  {currentSection.label}
                </h2>
                <p className="text-xs font-medium text-[var(--text-secondary)] truncate">{currentSection.description}</p>
              </div>
            </div>
          )}
          {renderTab()}
        </div>
      </div>

      {/* Recent website actions — everything performed from this panel, most recent first */}
      <div className="mt-6 bg-[var(--surface)] rounded-[1.5rem] border border-[var(--border)] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-[var(--text-primary)]">
            <History className="w-4 h-4 text-[var(--color-gold)]" aria-hidden="true" /> Recent Website Actions
          </h2>
          <Link to="/admin/activity" className="text-xs font-semibold text-[var(--text-secondary)] hover:underline">
            View full audit log
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-[var(--color-mid-gray)]">No website actions recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--sidebar-nav-hover-bg)] px-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--text-primary)]">{a.user}</span>
                    <span className="text-[var(--text-secondary)]">{a.action}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={getActivityStatus(a.status).tone}>{getActivityStatus(a.status).label}</Badge>
                  <span className="text-[11px] font-medium text-[var(--text-secondary)] whitespace-nowrap" title={new Date(a.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}>
                    {timeAgo(a.date)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isListTab && (
        <EntityFormModal
          key={`${tab}-${formModal.mode}-${formModal.item?.id || 'new'}-${formModal.open ? 'open' : 'closed'}`}
          open={formModal.open}
          onClose={() => setFormModal({ open: false, mode: 'add', item: null })}
          title={modalTitles[tab]}
          fields={fieldSets[tab]}
          initial={formModal.item}
          onSubmit={submitHandlers[tab]}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteHandlers[tab]?.confirm}
        title="Delete this item?"
        message={`This will permanently remove "${deleteHandlers[tab]?.label(deleteTarget)}" from the public website. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
