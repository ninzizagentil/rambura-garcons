import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Pencil, Trash2, Plus, Save, ExternalLink, History, RotateCcw, ImageOff,
  LayoutPanelTop, GraduationCap, Building2, Users, Newspaper, Images, CalendarDays,
  ClipboardList, Phone, ImageIcon, ChevronRight, ChevronDown,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import HillRidgeDivider from '../../components/common/HillRidgeDivider';
import DataTable from '../../components/tables/DataTable';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import Modal from '../../components/modals/Modal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import ImageField from '../../components/forms/ImageField';
import { EmptyState } from '../../components/feedback/States';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getActivity, logActivity, useActivityVersion } from '../../services/activityService';
import { getSiteImageSlots, updateSiteImage, resetSiteImage, useSiteImageVersion } from '../../services/imageService';
import { getActivityStatus, timeAgo } from '../../utils/activityStatus';
import { cn } from '../../utils/cn';
import { applyKindErrors, validateField } from '../../utils/validators';
import {
  getHero, updateHero,
  getPrograms, createProgram, updateProgram, deleteProgram,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getStaff, createStaffMember, updateStaffMember, deleteStaffMember,
  getNews, createNewsArticle, updateNewsArticle, deleteNewsArticle,
  getGallery, createGalleryImage, updateGalleryImage, deleteGalleryImage,
  getAdmissionsInfo, updateAdmissionsInfo,
  getContactInfo, updateContactInfo,
  getAbout, updateAboutInfo,
  getStaffPage, updateStaffPage,
  getAcademicsPage, updateAcademicsPage,
  getDepartmentsPage, updateDepartmentsPage,
  getNewsPage, updateNewsPage,
  getGalleryPage, updateGalleryPage,
  getContactPage, updateContactPage,
  getDevelopersPage, updateDevelopersPage,
  useContentVersion,
} from '../../services/contentService';
import { getEvents, refreshEvents, createEvent, updateEvent, deleteEvent } from '../../services/eventService';

const SECTION_GROUPS = [
  {
    group: 'Homepage Content',
    blurb: 'What visitors see first',
    sections: [
      { value: 'hero', label: 'Home Hero', icon: LayoutPanelTop, description: 'Banner heading, intro & stat bar' },
      { value: 'about', label: 'About Us', icon: Building2, description: 'History, mission, values & facilities' },
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
      { value: 'events', label: 'Events', icon: CalendarDays, description: 'Upcoming school events & dates', countKey: 'events' },
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

const ALL_SECTIONS = SECTION_GROUPS.flatMap((g) => g.sections);

const WEBSITE_KEYS = {
  'Homepage Content': 'websiteHomepageContent',
  'What visitors see first': 'websiteHomepageBlurb',
  'Home Hero': 'websiteHomeHero',
  'Banner heading, intro & stat bar': 'websiteHomeHeroDescription',
  'About Us': 'aboutUs',
  'History, mission, values & facilities': 'aboutUsDescription',
  Admissions: 'websiteAdmissions',
  'Requirements, dates & process': 'websiteAdmissionsDescription',
  Contact: 'websiteContact',
  'Address, phone, email & map': 'websiteContactDescription',
  'Pages & Listings': 'websitePagesListings',
  'Programs, people & stories': 'websitePagesBlurb',
  Programs: 'websitePrograms',
  'Academic programs offered': 'websiteProgramsDescription',
  Departments: 'websiteDepartments',
  'School departments & heads': 'websiteDepartmentsDescription',
  Staff: 'websiteStaff',
  'Staff directory & bios': 'websiteStaffDescription',
  News: 'websiteNews',
  'Announcements & articles': 'websiteNewsDescription',
  'Media & Gallery': 'websiteMediaGallery',
  'Photos across the site': 'websiteMediaBlurb',
  Gallery: 'websiteGallery',
  'Public photo gallery grid': 'websiteGalleryDescription',
  'Site Images': 'websiteSiteImages',
  'Hero & page background photos': 'websiteImagesDescription',
  Actions: 'actions',
  Save: 'save',
  Cancel: 'cancel',
  Reset: 'reset',
  Photo: 'photo',
  'Custom photo': 'customPhoto',
  'Website Management': 'websiteManagement',
  'Manage every piece of content on the public website — changes here appear live on the site immediately.': 'websiteManagementDescription',
  'All Website Activity': 'allWebsiteActivity',
  'View Sit e': 'viewSite',
  Add: 'add',
  'Recent Website Actions': 'recentWebsiteActions',
  'View full audit log': 'viewFullAuditLog',
  'No website actions recorded yet.': 'noWebsiteActions',
  'Delete this item?': 'deleteItemQuestion',
  Delete: 'delete',
  'Program Title': 'programTitle',
  Level: 'level',
  Duration: 'duration',
  'Short Summary (shown on cards)': 'shortSummary',
  'Full Details (shown when a visitor clicks "Learn More")': 'fullDetails',
  'Shown on the Academics page card for this program.': 'programPhotoHint',
  'Department Name': 'departmentName',
  'Head of Department': 'headOfDepartment',
  'Staff Count': 'staffCount',
  'Shown on the Departments page card.': 'departmentPhotoHint',
  'Full Name': 'fullName',
  'Role / Title': 'roleTitle',
  Department: 'department',
  'Short Bio': 'shortBio',
  'Shown on the Staff page.': 'staffPhotoHint',
  Title: 'title',
  Date: 'date',
  Category: 'category',
  Announcement: 'announcement',
  Achievement: 'achievement',
  Facilities: 'facilities',
  Event: 'event',
  'Short Excerpt (shown on News list)': 'shortExcerpt',
  'Full Article Content': 'fullArticleContent',
  'Shown on the News list and the article page.': 'newsPhotoHint',
  Caption: 'caption',
  'The actual picture shown in the Gallery grid.': 'galleryPhotoHint',
};

function websiteText(t, value) {
  return t(WEBSITE_KEYS[value] || value);
}

/**
 * SectionSidebar — the primary navigation for Website Management: a vertical
 * stack of glass rows grouped by purpose, pinned to the left of the content
 * panel on wider screens. Below `lg`, it collapses into a horizontal
 * scrolling strip of pills grouped the same way, so the same structure holds
 * up on tablets and phones.
 */
function SectionSidebar({ active, onChange, counts }) {
  const { t } = useApp();
  const activeGroup = SECTION_GROUPS.find((group) => group.sections.some((section) => section.value === active))?.group;
  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(SECTION_GROUPS.map((group) => [group.group, true])));

  // Re-open the active section's group when it changes (adjusted during render,
  // not in an effect — https://react.dev/learn/you-might-not-need-an-effect).
  const [prevActiveGroup, setPrevActiveGroup] = useState(activeGroup);
  if (activeGroup !== prevActiveGroup) {
    setPrevActiveGroup(activeGroup);
    if (activeGroup) setOpenGroups((groups) => ({ ...groups, [activeGroup]: true }));
  }

  const toggleGroup = (group) => {
    setOpenGroups((groups) => ({ ...groups, [group]: !groups[group] }));
  };

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
            {websiteText(t, s.label)}
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
            {websiteText(t, s.label)}
          </span>
          <span className={cn('block text-[11px] leading-snug truncate', isActive ? 'text-[var(--sidebar-text-secondary)]' : 'text-[var(--sidebar-text-secondary)]')}>
            {websiteText(t, s.description)}
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
      <div className="pointer-events-none absolute -top-14 -right-10 w-48 h-48 rounded-full bg-[var(--color-soft-gray)] opacity-70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-[var(--color-gold)] opacity-10 blur-3xl" aria-hidden="true" />

      <div className="hidden lg:block relative p-4 max-h-[calc(100vh-3rem)] overflow-y-auto">
        {SECTION_GROUPS.map((grp, i) => (
          <div key={grp.group} className={i > 0 ? 'mt-5 pt-5 border-t border-[rgba(255,255,255,0.10)]' : ''}>
            <button
              type="button"
              onClick={() => toggleGroup(grp.group)}
              aria-expanded={openGroups[grp.group]}
              className="group flex w-full items-center justify-between rounded-lg border border-[var(--sidebar-border)] bg-[var(--surface)] px-3 py-2 mb-2 text-left transition-colors hover:border-[var(--color-gold)]/50 hover:bg-[var(--sidebar-nav-hover-bg)] focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2"
            >
              <span className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--color-gold)]">
                {websiteText(t, grp.group)}
              </span>
              <ChevronDown className={cn('h-4 w-4 text-[var(--color-gold)] transition-transform', !openGroups[grp.group] && '-rotate-90')} aria-hidden="true" />
            </button>
            {openGroups[grp.group] && (
              <div className="space-y-1.5">
                {grp.sections.map((s) => <Row key={s.value} s={s} />)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="lg:hidden relative p-4 space-y-3">
        {SECTION_GROUPS.map((grp) => (
          <div key={grp.group}>
            <button
              type="button"
              onClick={() => toggleGroup(grp.group)}
              aria-expanded={openGroups[grp.group]}
              className="group flex w-full items-center justify-between rounded-lg border border-[var(--sidebar-border)] bg-[var(--surface)] px-3 py-2 mb-1.5 text-left transition-colors hover:border-[var(--color-gold)]/50 hover:bg-[var(--sidebar-nav-hover-bg)] focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2"
            >
              <span className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--color-gold)]">
                {websiteText(t, grp.group)}
              </span>
              <ChevronDown className={cn('h-4 w-4 text-[var(--color-gold)] transition-transform', !openGroups[grp.group] && '-rotate-90')} aria-hidden="true" />
            </button>
            {openGroups[grp.group] && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {grp.sections.map((s) => <Row key={s.value} s={s} compact />)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pointer-events-none opacity-[0.08] -mt-1" aria-hidden="true">
        <HillRidgeDivider tone="light" />
      </div>
    </nav>
  );
}

const toLines = (arr) => (arr || []).join('\n');
const fromLines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

function EntityFormModal({ open, onClose, title, fields, initial, onSubmit }) {
  const { t } = useApp();
  const [values, setValues] = useState(initial || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const missing = fields.find((f) => f.required && !String(values[f.key] ?? '').trim());
    if (missing) {
      setError(t('websiteRequiredField', { field: missing.label }));
      return;
    }
    const invalid = fields.find((f) => f.kind && validateField(f.kind, values[f.key], t));
    if (invalid) {
      setError(`${websiteText(t, invalid.label)}: ${validateField(invalid.kind, values[invalid.key], t)}`);
      return;
    }
    setSaving(true);
    const result = await onSubmit(values);
    setSaving(false);
    if (result && result.success === false) {
      setError(result.error || t('somethingWentWrong'));
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
              label={websiteText(t, f.label)}
              required={f.required}
              rows={f.rows || 3}
              value={values[f.key] ?? ''}
              onChange={set(f.key)}
              hint={f.hint}
            />
          ) : f.type === 'select' ? (
            <Select
              key={f.key}
              label={websiteText(t, f.label)}
              required={f.required}
              value={values[f.key] ?? ''}
              onChange={set(f.key)}
              options={f.options || []}
              placeholder={f.placeholder || t('selectAnOption')}
              hint={f.hint}
            />
          ) : f.type === 'image' ? (
            <ImageField
              key={f.key}
              label={websiteText(t, f.label)}
              required={f.required}
              value={values[f.key] ?? ''}
              onChange={(dataUrl) => setValues((v) => ({ ...v, [f.key]: dataUrl }))}
              hint={f.hint}
            />
          ) : (
            <Input
              key={f.key}
              label={websiteText(t, f.label)}
              type={f.type || 'text'}
              kind={f.kind}
              required={f.required}
              icon={f.icon}
              value={values[f.key] ?? ''}
              onChange={set(f.key)}
              hint={f.hint}
            />
          )
        )}
        <div className="flex gap-3 pt-1">
          <Button type="submit" variant="primary" loading={saving} className="flex-1">{t('save')}</Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
        </div>
      </form>
    </Modal>
  );
}

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

function SiteImagesPanel({ user, notify, notifyError, bumpActivity }) {
  const { t } = useApp();
  const imageVersion = useSiteImageVersion();
  // Slots are a synchronous read from the image cache: compute them during
  // render (the useSiteImageVersion() hook above re-renders us when the cache
  // changes) and let `refresh` force a re-render after local saves.
  const [, setTick] = useState(0);
  const slots = getSiteImageSlots();
  const [drafts, setDrafts] = useState({});
  const [savingPath, setSavingPath] = useState(null);

  const refresh = () => setTick((n) => n + 1);
  void imageVersion;
  const draftFor = (path, fallback) => (drafts[path] ?? fallback);

  const handleSave = async (path) => {
    const url = drafts[path];
    setSavingPath(path);
    const result = await updateSiteImage(path, url, user);
    setSavingPath(null);
    if (result.success) {
      refresh();
      setDrafts((d) => { const next = { ...d }; delete next[path]; return next; });
      notify(t('imageUpdated'));
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
    notify(t('imageReset'));
    bumpActivity();
  };

  const groups = slots.reduce((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-8">
      <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)] max-w-2xl">
        {t('websiteImagesInstructions')}
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
                    {slot.isCustom && <Badge tone="gold" className="mt-1">{t('customPhoto')}</Badge>}
                  </div>
                </div>
                <ImageField
                  className="mt-3"
                  label={t('photo')}
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
                    {t('save')}
                  </Button>
                  {slot.isCustom && (
                    <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => handleReset(slot.path)}>
                      {t('reset')}
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
  const { t } = useApp();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab = ALL_SECTIONS.some((section) => section.value === requestedTab) ? requestedTab : 'hero';
  const [tab, setTab] = useState(initialTab);
  const contentVersion = useContentVersion();
  const activityVersion = useActivityVersion();

  // Follow the ?tab= query param when it changes (adjusted during render).
  const [prevRequestedTab, setPrevRequestedTab] = useState(requestedTab);
  if (requestedTab !== prevRequestedTab) {
    setPrevRequestedTab(requestedTab);
    if (requestedTab && ALL_SECTIONS.some((section) => section.value === requestedTab)) setTab(requestedTab);
  }

  const [programs, setPrograms] = useState(getPrograms());
  const [departments, setDepartments] = useState(getDepartments());
  const [staff, setStaff] = useState(getStaff());
  const [news, setNews] = useState(getNews());
  const [gallery, setGallery] = useState(getGallery());
  const [events, setEvents] = useState(getEvents());
  const siteImageCount = useMemo(() => getSiteImageSlots().length, []);

  const [heroForm, setHeroForm] = useState(getHero());
  const [aboutForm, setAboutForm] = useState(getAbout());
  const [staffPageForm, setStaffPageForm] = useState(getStaffPage());
  const [academicsPageForm, setAcademicsPageForm] = useState(getAcademicsPage());
  const [departmentsPageForm, setDepartmentsPageForm] = useState(getDepartmentsPage());
  const [newsPageForm, setNewsPageForm] = useState(getNewsPage());
  const [galleryPageForm, setGalleryPageForm] = useState(getGalleryPage());
  const [contactPageForm, setContactPageForm] = useState(getContactPage());
  const [developersPageForm, setDevelopersPageForm] = useState(getDevelopersPage());
  const [admissionsForm, setAdmissionsForm] = useState(() => {
    const a = getAdmissionsInfo();
    return { ...a, requirements: toLines(a.requirements), dates: toLines(a.dates) };
  });
  const [contactForm, setContactForm] = useState(getContactInfo());
  const [savingSingle, setSavingSingle] = useState(false);

  const heroDirty = useRef(false);
  const admissionsDirty = useRef(false);
  const contactDirty = useRef(false);
  const aboutDirty = useRef(false);
  const staffPageDirty = useRef(false);
  const academicsPageDirty = useRef(false);
  const departmentsPageDirty = useRef(false);
  const newsPageDirty = useRef(false);
  const galleryPageDirty = useRef(false);
  const contactPageDirty = useRef(false);
  const developersPageDirty = useRef(false);
  const editHero = (updater) => { heroDirty.current = true; setHeroForm(updater); };
  const editAdmissions = (updater) => { admissionsDirty.current = true; setAdmissionsForm(updater); };
  const editContact = (updater) => { contactDirty.current = true; setContactForm(updater); };
  const editAbout = (updater) => { aboutDirty.current = true; setAboutForm(updater); };
  const editStaffPage = (updater) => { staffPageDirty.current = true; setStaffPageForm(updater); };
  const editAcademicsPage = (updater) => { academicsPageDirty.current = true; setAcademicsPageForm(updater); };
  const editDepartmentsPage = (updater) => { departmentsPageDirty.current = true; setDepartmentsPageForm(updater); };
  const editNewsPage = (updater) => { newsPageDirty.current = true; setNewsPageForm(updater); };
  const editGalleryPage = (updater) => { galleryPageDirty.current = true; setGalleryPageForm(updater); };
  const editContactPage = (updater) => { contactPageDirty.current = true; setContactPageForm(updater); };
  const editDevelopersPage = (updater) => { developersPageDirty.current = true; setDevelopersPageForm(updater); };

  // Copies the content cache into local editable state whenever it reloads
  // (guarded by the *Dirty refs so in-progress typing is never overwritten).
  // This is a genuine sync with an external store, so the rule is silenced.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
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
    if (!aboutDirty.current) setAboutForm(getAbout());
    if (!staffPageDirty.current) setStaffPageForm(getStaffPage());
    if (!academicsPageDirty.current) setAcademicsPageForm(getAcademicsPage());
    if (!departmentsPageDirty.current) setDepartmentsPageForm(getDepartmentsPage());
    if (!newsPageDirty.current) setNewsPageForm(getNewsPage());
    if (!galleryPageDirty.current) setGalleryPageForm(getGalleryPage());
    if (!contactPageDirty.current) setContactPageForm(getContactPage());
    if (!developersPageDirty.current) setDevelopersPageForm(getDevelopersPage());
  }, [contentVersion]);

  const notify = (msg) => showToast(msg, 'success');
  const notifyError = (msg) => showToast(msg, 'error');

  useEffect(() => {
    refreshEvents().then(() => setEvents(getEvents())).catch((error) => notifyError(error.message));
    const handler = () => setEvents(getEvents());
    window.addEventListener('rg:events-updated', handler);
    return () => window.removeEventListener('rg:events-updated', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [formModal, setFormModal] = useState({ open: false, mode: 'add', item: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const recentActivity = useMemo(
    () => { void refreshTick; void activityVersion; return getActivity().filter((a) => a.module === 'Website').slice(0, 6); },
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

  const saveHero = async (e) => {
    e.preventDefault();
    const problem = (heroForm.testimonials || []).flatMap((item) => Object.values(applyKindErrors({}, item, { name: 'name' })))[0];
    if (problem) { notifyError(problem); return; }
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

  const programFields = [
    { key: 'title', label: 'Program Title', required: true, kind: 'alnum' },
    { key: 'level', label: 'Level', required: true, kind: 'alnum' },
    { key: 'duration', label: 'Duration', required: true, kind: 'alnum' },
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
    const result = await deleteProgram(deleteTarget.id, user);
    if (!result.success) { notifyError(result.error); return; }
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

  const departmentFields = [
    { key: 'name', label: 'Department Name', required: true, kind: 'alnum' },
    { key: 'head', label: 'Head of Department', required: true, kind: 'name' },
    { key: 'staffCount', label: 'Staff Count', required: true, kind: 'integer' },
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
    const result = await deleteDepartment(deleteTarget.id, user);
    if (!result.success) { notifyError(result.error); return; }
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

  const staffFields = [
    { key: 'name', label: 'Full Name', required: true, kind: 'name' },
    { key: 'role', label: 'Role / Title', required: true, kind: 'name' },
    { key: 'department', label: 'Department', required: true, kind: 'alnum' },
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
    const result = await deleteStaffMember(deleteTarget.id, user);
    if (!result.success) { notifyError(result.error); return; }
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

  const newsFields = [
    { key: 'title', label: 'Title', required: true, kind: 'alnum' },
    { key: 'date', label: 'Date', type: 'date', icon: CalendarDays, required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: [
      { value: 'Announcement', label: 'Announcement' },
      { value: 'Admissions', label: 'Admissions' },
      { value: 'Achievement', label: 'Achievement' },
      { value: 'Facilities', label: 'Facilities' },
      { value: 'Event', label: 'Event' },
    ] },
    { key: 'excerpt', label: 'Short Excerpt (shown on News list)', type: 'textarea', required: true },
    { key: 'content', label: 'Full Article Content', type: 'textarea', rows: 6, required: true },
    { key: 'image', label: 'Photo', type: 'image', required: true, hint: 'Shown on the News list and the article page.' },
  ];
  const openAddNews = () => setFormModal({ open: true, mode: 'add', item: { category: 'Announcement' } });
  const openEditNews = (n) => setFormModal({ open: true, mode: 'edit', item: { ...n, category: n.category || 'Announcement' } });
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
    const result = await deleteNewsArticle(deleteTarget.id, user);
    if (!result.success) { notifyError(result.error); return; }
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

  const eventFields = [
    { key: 'title', label: 'Title', required: true, kind: 'alnum' },
    { key: 'startDate', label: 'Start Date & Time', type: 'datetime-local', required: true },
    { key: 'endDate', label: 'End Date & Time', type: 'datetime-local' },
    { key: 'location', label: 'Location', required: true, kind: 'alnum' },
    { key: 'description', label: 'Description', type: 'textarea', rows: 4, required: true },
  ];
  const openAddEvent = () => setFormModal({ open: true, mode: 'add', item: { published: true } });
  const openEditEvent = (ev) => setFormModal({ open: true, mode: 'edit', item: { ...ev, startDate: ev.startDate?.slice(0, 16) || '', endDate: ev.endDate?.slice(0, 16) || '' } });
  const submitEvent = async (values) => {
    const result = formModal.mode === 'add'
      ? createEvent({ ...values, published: true })
      : updateEvent(formModal.item.id, values);
    const resolved = await result;
    if (resolved.success) {
      setEvents(getEvents());
      setFormModal({ open: false, mode: 'add', item: null });
      recordWebsiteAction(formModal.mode === 'add' ? 'Published a school event' : 'Updated a school event');
      notify(formModal.mode === 'add' ? 'Event published.' : 'Event updated.');
      addNotification({
        type: 'website',
        message: formModal.mode === 'add' ? `Event "${values.title}" has been published.` : `Event "${values.title}" has been updated.`,
        to: '/admin/website',
      });
      bumpActivity();
    } else {
      notifyError(resolved.error);
    }
    return resolved;
  };
  const confirmDeleteEvent = async () => {
    const result = await deleteEvent(deleteTarget.id);
    if (!result.success) { notifyError(result.error); return; }
    setEvents(getEvents());
    setDeleteTarget(null);
    recordWebsiteAction('Deleted a school event');
    notify('Event deleted.');
    addNotification({
      type: 'website',
      message: `Event "${deleteTarget.title}" has been deleted.`,
      to: '/admin/website',
    });
    bumpActivity();
  };

  const galleryFields = [
    { key: 'caption', label: 'Caption', required: true, kind: 'alnum' },
    { key: 'category', label: 'Category', type: 'select', required: true, options: [
      { value: 'Workshops', label: 'Workshops' },
      { value: 'Events', label: 'Events' },
      { value: 'Campus Life', label: 'Campus Life' },
      { value: 'Student Life', label: 'Student Life' },
      { value: 'Sports', label: 'Sports' },
      { value: 'Facilities', label: 'Facilities' },
      { value: 'Community', label: 'Community' },
      { value: 'Ceremonies', label: 'Ceremonies' },
      { value: 'General', label: 'General' },
    ], hint: 'Group this photo in a public gallery category.' },
    { key: 'image', label: 'Photo', type: 'image', required: true, hint: 'The actual picture shown in the Gallery grid.' },
  ];
  const openAddGallery = () => setFormModal({ open: true, mode: 'add', item: { category: 'General' } });
  const openEditGallery = (g) => setFormModal({ open: true, mode: 'edit', item: { ...g, category: g.category || 'General' } });
  const submitGallery = async (values) => {
    const result = formModal.mode === 'add'
      ? createGalleryImage(values, user)
      : updateGalleryImage(formModal.item.id, values, user);
    const resolved = await result;
    if (resolved.success) {
      setGallery(getGallery());
      setFormModal({ open: false, mode: 'add', item: null });
      recordWebsiteAction(formModal.mode === 'add' ? 'Added a gallery image' : 'Updated a gallery image');
      notify(formModal.mode === 'add' ? 'Image added.' : 'Gallery image updated.');
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
    const result = await deleteGalleryImage(deleteTarget.id, user);
    if (!result.success) { notifyError(result.error); return; }
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
    const problem = Object.values(applyKindErrors({}, contactForm, { phone: 'phone', email: 'email' }))[0];
    if (problem) { notifyError(problem); return; }
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
  const saveAbout = async (e) => {
    e.preventDefault();
    setSavingSingle(true);
    const result = await updateAboutInfo(aboutForm, user);
    setSavingSingle(false);
    if (result.success) {
      aboutDirty.current = false;
      setAboutForm(getAbout());
      recordWebsiteAction('Updated the About Us page');
      notify('About Us page content saved.');
      addNotification({ type: 'website', message: 'About Us page has been updated.', to: '/admin/website' });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };
  const saveStaffPage = async (e) => {
    e.preventDefault();
    setSavingSingle(true);
    const result = await updateStaffPage(staffPageForm, user);
    setSavingSingle(false);
    if (result.success) {
      staffPageDirty.current = false;
      setStaffPageForm(getStaffPage());
      recordWebsiteAction('Updated the Staff page');
      notify('Staff page content saved.');
      addNotification({ type: 'website', message: 'Staff page has been updated.', to: '/admin/website' });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };
  const saveAcademicsPage = async (e) => {
    e.preventDefault();
    setSavingSingle(true);
    const result = await updateAcademicsPage(academicsPageForm, user);
    setSavingSingle(false);
    if (result.success) {
      academicsPageDirty.current = false;
      setAcademicsPageForm(getAcademicsPage());
      recordWebsiteAction('Updated the Academics page');
      notify('Academics page content saved.');
      addNotification({ type: 'website', message: 'Academics page has been updated.', to: '/admin/website' });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };
  const saveDepartmentsPage = async (e) => {
    e.preventDefault();
    setSavingSingle(true);
    const result = await updateDepartmentsPage(departmentsPageForm, user);
    setSavingSingle(false);
    if (result.success) {
      departmentsPageDirty.current = false;
      setDepartmentsPageForm(getDepartmentsPage());
      recordWebsiteAction('Updated the Departments page');
      notify('Departments page content saved.');
      addNotification({ type: 'website', message: 'Departments page has been updated.', to: '/admin/website' });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };
  const saveNewsPage = async (e) => {
    e.preventDefault();
    setSavingSingle(true);
    const result = await updateNewsPage(newsPageForm, user);
    setSavingSingle(false);
    if (result.success) {
      newsPageDirty.current = false;
      setNewsPageForm(getNewsPage());
      recordWebsiteAction('Updated the News page');
      notify('News page content saved.');
      addNotification({ type: 'website', message: 'News page has been updated.', to: '/admin/website' });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };
  const saveGalleryPage = async (e) => {
    e.preventDefault();
    setSavingSingle(true);
    const result = await updateGalleryPage(galleryPageForm, user);
    setSavingSingle(false);
    if (result.success) {
      galleryPageDirty.current = false;
      setGalleryPageForm(getGalleryPage());
      recordWebsiteAction('Updated the Gallery page');
      notify('Gallery page content saved.');
      addNotification({ type: 'website', message: 'Gallery page has been updated.', to: '/admin/website' });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };
  const saveContactPage = async (e) => {
    e.preventDefault();
    const problem = Object.values(applyKindErrors({}, contactPageForm, { developerName: 'name' }))[0];
    if (problem) { notifyError(problem); return; }
    setSavingSingle(true);
    const result = await updateContactPage(contactPageForm, user);
    setSavingSingle(false);
    if (result.success) {
      contactPageDirty.current = false;
      setContactPageForm(getContactPage());
      recordWebsiteAction('Updated Contact Us page content');
      notify('Contact Us page content saved.');
      addNotification({ type: 'website', message: 'Contact Us page has been updated.', to: '/admin/website' });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };
  const saveDevelopersPage = async (e) => {
    e.preventDefault();
    const problem = (developersPageForm.developers || []).flatMap((d) => Object.values(applyKindErrors({}, d, { name: 'lettersOnly', role: 'lettersOnly' })))[0];
    if (problem) { notifyError(problem); return; }
    setSavingSingle(true);
    const result = await updateDevelopersPage(developersPageForm, user);
    setSavingSingle(false);
    if (result.success) {
      developersPageDirty.current = false;
      setDevelopersPageForm(getDevelopersPage());
      recordWebsiteAction('Updated the Developers page');
      notify('Developers page content saved.');
      addNotification({ type: 'website', message: 'Developers page has been updated.', to: '/admin/website' });
      bumpActivity();
    } else {
      notifyError(result.error);
    }
  };

  const deleteHandlers = {
    programs: { confirm: confirmDeleteProgram, label: (t) => t?.title },
    departments: { confirm: confirmDeleteDepartment, label: (t) => t?.name },
    staff: { confirm: confirmDeleteStaff, label: (t) => t?.name },
    news: { confirm: confirmDeleteNews, label: (t) => t?.title },
    events: { confirm: confirmDeleteEvent, label: (t) => t?.title },
    gallery: { confirm: confirmDeleteGallery, label: (t) => t?.caption },
  };

  const actionCol = (onEdit, labelKey) => ({
    key: 'actions',
    header: t('actions'),
    render: (row) => (
      <div className="flex items-center gap-1">
        <IconButton icon={Pencil} label={`${t('edit')} ${row[labelKey]}`} onClick={() => onEdit(row)} />
        <IconButton icon={Trash2} label={`${t('delete')} ${row[labelKey]}`} variant="danger" onClick={() => setDeleteTarget(row)} />
      </div>
    ),
  });

  const renderTab = () => {
    if (tab === 'about') {
      return (
        <form onSubmit={saveAbout} className="p-6 space-y-5 max-w-3xl">
          <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">Edit the text shown on the public About Us page. About page images are managed in Site Images.</p>
          <Input label="Page title" required value={aboutForm.heroTitle} onChange={(e) => editAbout((a) => ({ ...a, heroTitle: e.target.value }))} />
          <Textarea label="Page introduction" required rows={2} value={aboutForm.heroIntro} onChange={(e) => editAbout((a) => ({ ...a, heroIntro: e.target.value }))} />
          <Input label="History heading" required value={aboutForm.historyTitle} onChange={(e) => editAbout((a) => ({ ...a, historyTitle: e.target.value }))} />
          <Textarea label="History" required rows={5} value={aboutForm.history} onChange={(e) => editAbout((a) => ({ ...a, history: e.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3"><Input label="Mission heading" required value={aboutForm.missionTitle} onChange={(e) => editAbout((a) => ({ ...a, missionTitle: e.target.value }))} /><Textarea label="Mission" required rows={4} value={aboutForm.mission} onChange={(e) => editAbout((a) => ({ ...a, mission: e.target.value }))} /></div>
            <div className="space-y-3"><Input label="Vision heading" required value={aboutForm.visionTitle} onChange={(e) => editAbout((a) => ({ ...a, visionTitle: e.target.value }))} /><Textarea label="Vision" required rows={4} value={aboutForm.vision} onChange={(e) => editAbout((a) => ({ ...a, vision: e.target.value }))} /></div>
          </div>
          <Input label="Values heading" required value={aboutForm.valuesTitle} onChange={(e) => editAbout((a) => ({ ...a, valuesTitle: e.target.value }))} />
          <Textarea label="Core values (one per line)" required rows={4} value={(aboutForm.values || []).join('\n')} onChange={(e) => editAbout((a) => ({ ...a, values: fromLines(e.target.value) }))} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Leadership heading" required value={aboutForm.leadershipTitle} onChange={(e) => editAbout((a) => ({ ...a, leadershipTitle: e.target.value }))} />
            <Input label="Leadership introduction" required value={aboutForm.leadershipIntro} onChange={(e) => editAbout((a) => ({ ...a, leadershipIntro: e.target.value }))} />
          </div>
          <Input label="Facilities heading" required value={aboutForm.facilitiesTitle} onChange={(e) => editAbout((a) => ({ ...a, facilitiesTitle: e.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-3">
            {(aboutForm.facilities || []).map((facility, index) => (
              <Input key={facility.key} label={`Facility ${index + 1}`} required value={facility.label} onChange={(e) => editAbout((a) => ({ ...a, facilities: a.facilities.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item) }))} />
            ))}
          </div>
          <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save About Us Content</Button>
        </form>
      );
    }

    if (tab === 'hero') {
      return (
        <form onSubmit={saveHero} className="p-6 space-y-5 max-w-3xl">
          <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">
            {t('heroEditorDescription')}
          </p>
          <Input label={t('eyebrowTag')} required value={heroForm.eyebrow} onChange={(e) => editHero((h) => ({ ...h, eyebrow: e.target.value }))} />
          <Input label={t('mainHeading')} required value={heroForm.title} onChange={(e) => editHero((h) => ({ ...h, title: e.target.value }))} />
          <Textarea label={t('introParagraph')} required rows={3} value={heroForm.subtitle} onChange={(e) => editHero((h) => ({ ...h, subtitle: e.target.value }))} />
          <div>
            <p className="text-sm font-medium text-[var(--color-dark-gray)] mb-2">{t('statBar')}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {heroForm.stats.map((s, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Input label={t('valueNumber', { number: i + 1 })} value={s.value} onChange={setStat(i, 'value')} />
                  <Input label={t('labelNumber', { number: i + 1 })} value={s.label} onChange={setStat(i, 'label')} />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 border-t border-[var(--color-border-gray)] pt-5">
            <p className="text-sm font-semibold text-[var(--color-dark-gray)]">Home buttons</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Primary button" required value={heroForm.homeContent?.heroButtons?.primary || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, heroButtons: { ...h.homeContent?.heroButtons, primary: e.target.value } } }))} />
              <Input label="Secondary button" required value={heroForm.homeContent?.heroButtons?.secondary || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, heroButtons: { ...h.homeContent?.heroButtons, secondary: e.target.value } } }))} />
            </div>
            <p className="text-sm font-semibold text-[var(--color-dark-gray)]">Hero highlights</p>
            {(heroForm.homeContent?.highlights || []).map((highlight, index) => (
              <div key={index} className="grid sm:grid-cols-2 gap-3">
                <Input label={`Highlight ${index + 1}`} required value={highlight.title || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, highlights: h.homeContent.highlights.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) } }))} />
                <Input label={`Highlight ${index + 1} detail`} required value={highlight.subtitle || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, highlights: h.homeContent.highlights.map((item, itemIndex) => itemIndex === index ? { ...item, subtitle: e.target.value } : item) } }))} />
              </div>
            ))}
          </div>
          <div className="space-y-4 border-t border-[var(--color-border-gray)] pt-5">
            <p className="text-sm font-semibold text-[var(--color-dark-gray)]">Home About preview</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Eyebrow" required value={heroForm.homeContent?.aboutPreview?.eyebrow || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, aboutPreview: { ...h.homeContent?.aboutPreview, eyebrow: e.target.value } } }))} />
              <Input label="Accent heading" required value={heroForm.homeContent?.aboutPreview?.titleAccent || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, aboutPreview: { ...h.homeContent?.aboutPreview, titleAccent: e.target.value } } }))} />
            </div>
            <Input label="Main heading" required value={heroForm.homeContent?.aboutPreview?.title || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, aboutPreview: { ...h.homeContent?.aboutPreview, title: e.target.value } } }))} />
            <Textarea label="Description" required rows={3} value={heroForm.homeContent?.aboutPreview?.description || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, aboutPreview: { ...h.homeContent?.aboutPreview, description: e.target.value } } }))} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Image label" required value={heroForm.homeContent?.aboutPreview?.imageLabel || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, aboutPreview: { ...h.homeContent?.aboutPreview, imageLabel: e.target.value } } }))} />
              <Input label="Image title" required value={heroForm.homeContent?.aboutPreview?.imageTitle || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, aboutPreview: { ...h.homeContent?.aboutPreview, imageTitle: e.target.value } } }))} />
            </div>
          </div>
          <div className="space-y-4 border-t border-[var(--color-border-gray)] pt-5">
            <p className="text-sm font-semibold text-[var(--color-dark-gray)]">Programs section</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Eyebrow" required value={heroForm.homeContent?.programs?.eyebrow || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, programs: { ...h.homeContent?.programs, eyebrow: e.target.value } } }))} />
              <Input label="Heading" required value={heroForm.homeContent?.programs?.title || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, programs: { ...h.homeContent?.programs, title: e.target.value } } }))} />
              <Input label="View all button" required value={heroForm.homeContent?.programs?.button || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, programs: { ...h.homeContent?.programs, button: e.target.value } } }))} />
              <Input label="Program card action" required value={heroForm.homeContent?.programs?.cardAction || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, programs: { ...h.homeContent?.programs, cardAction: e.target.value } } }))} />
            </div>
          </div>
          <div className="space-y-4 border-t border-[var(--color-border-gray)] pt-5">
            <p className="text-sm font-semibold text-[var(--color-dark-gray)]">Admissions call to action</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Eyebrow" required value={heroForm.homeContent?.admissionsCta?.eyebrow || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, admissionsCta: { ...h.homeContent?.admissionsCta, eyebrow: e.target.value } } }))} />
              <Input label="Button" required value={heroForm.homeContent?.admissionsCta?.button || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, admissionsCta: { ...h.homeContent?.admissionsCta, button: e.target.value } } }))} />
            </div>
            <Input label="Heading" required value={heroForm.homeContent?.admissionsCta?.title || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, admissionsCta: { ...h.homeContent?.admissionsCta, title: e.target.value } } }))} />
            <Textarea label="Description" required rows={2} value={heroForm.homeContent?.admissionsCta?.description || ''} onChange={(e) => editHero((h) => ({ ...h, homeContent: { ...h.homeContent, admissionsCta: { ...h.homeContent?.admissionsCta, description: e.target.value } } }))} />
          </div>
          <div className="space-y-4 border-t border-[var(--color-border-gray)] pt-5">
            <p className="text-sm font-semibold text-[var(--color-dark-gray)]">Student voices</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Section label" required value={heroForm.studentVoices?.eyebrow || ''} onChange={(e) => editHero((h) => ({ ...h, studentVoices: { ...h.studentVoices, eyebrow: e.target.value } }))} />
              <Input label="Section heading" required value={heroForm.studentVoices?.title || ''} onChange={(e) => editHero((h) => ({ ...h, studentVoices: { ...h.studentVoices, title: e.target.value } }))} />
            </div>
            {(heroForm.testimonials || []).map((testimonial, index) => (
              <div key={index} className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4 space-y-3">
                <p className="text-sm font-semibold text-[var(--color-dark-gray)]">Student voice {index + 1}</p>
                <Textarea label="Quote" required rows={2} value={testimonial.quote || ''} onChange={(e) => editHero((h) => ({ ...h, testimonials: h.testimonials.map((item, itemIndex) => itemIndex === index ? { ...item, quote: e.target.value } : item) }))} />
                <div className="grid sm:grid-cols-2 gap-3"><Input kind="name" label="Name" required value={testimonial.name || ''} onChange={(e) => editHero((h) => ({ ...h, testimonials: h.testimonials.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item) }))} /><Input label="Program or role" required value={testimonial.detail || ''} onChange={(e) => editHero((h) => ({ ...h, testimonials: h.testimonials.map((item, itemIndex) => itemIndex === index ? { ...item, detail: e.target.value } : item) }))} /></div>
              </div>
            ))}
          </div>
          <div className="space-y-4 border-t border-[var(--color-border-gray)] pt-5">
            <p className="text-sm font-semibold text-[var(--color-dark-gray)]">Progress section</p>
            <div className="grid sm:grid-cols-2 gap-3"><Input label="Section label" required value={heroForm.progress?.eyebrow || ''} onChange={(e) => editHero((h) => ({ ...h, progress: { ...h.progress, eyebrow: e.target.value } }))} /><Input label="Section heading" required value={heroForm.progress?.title || ''} onChange={(e) => editHero((h) => ({ ...h, progress: { ...h.progress, title: e.target.value } }))} /></div>
            {(heroForm.achievements || []).map((achievement, index) => (
              <div key={index} className="grid sm:grid-cols-3 gap-3"><Input label={`Achievement ${index + 1} value`} required value={achievement.value || ''} onChange={(e) => editHero((h) => ({ ...h, achievements: h.achievements.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item) }))} /><Input label="Description" required value={achievement.label || ''} onChange={(e) => editHero((h) => ({ ...h, achievements: h.achievements.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item) }))} /><Input label="Year or status" required value={achievement.year || ''} onChange={(e) => editHero((h) => ({ ...h, achievements: h.achievements.map((item, itemIndex) => itemIndex === index ? { ...item, year: e.target.value } : item) }))} /></div>
            ))}
          </div>
          <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>{t('saveHeroContent')}</Button>
        </form>
      );
    }

    if (tab === 'programs') {
      return (
        <div>
          <form onSubmit={saveAcademicsPage} className="p-6 space-y-4 border-b border-[var(--border)]">
            <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">Edit the title and introduction shown at the top of the public Academics page.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Page title" required value={academicsPageForm.title} onChange={(e) => editAcademicsPage((page) => ({ ...page, title: e.target.value }))} />
              <Input label="Page introduction" required value={academicsPageForm.intro} onChange={(e) => editAcademicsPage((page) => ({ ...page, intro: e.target.value }))} />
            </div>
            <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save Academics Page Content</Button>
          </form>
          <DataTable
            columns={[
              { key: 'image', header: t('photo'), render: (p) => <Thumb src={p.image} alt={p.title} /> },
              { key: 'title', header: t('program') },
              { key: 'level', header: t('level') },
              { key: 'duration', header: t('duration') },
              actionCol(openEditProgram, 'title'),
            ]}
            data={programs}
            rowKey="slug"
            emptyState={<EmptyState title={t('noProgramsFound')} actionLabel={t('addProgram')} onAction={openAddProgram} />}
          />
        </div>
      );
    }

    if (tab === 'departments') {
      return (
        <div>
          <form onSubmit={saveDepartmentsPage} className="p-6 space-y-4 border-b border-[var(--border)]">
            <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">Edit the title and introduction shown at the top of the public Departments page.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Page title" required value={departmentsPageForm.title} onChange={(e) => editDepartmentsPage((page) => ({ ...page, title: e.target.value }))} />
              <Input label="Page introduction" required value={departmentsPageForm.intro} onChange={(e) => editDepartmentsPage((page) => ({ ...page, intro: e.target.value }))} />
            </div>
            <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save Departments Page Content</Button>
          </form>
          <DataTable
            columns={[
              { key: 'image', header: t('photo'), render: (d) => <Thumb src={d.image} alt={d.name} /> },
              { key: 'name', header: t('department') },
              { key: 'head', header: t('head') },
              { key: 'staffCount', header: t('staffCount') },
              actionCol(openEditDepartment, 'name'),
            ]}
            data={departments}
            rowKey="slug"
            emptyState={<EmptyState title={t('noDepartmentsFound')} actionLabel={t('addDepartment')} onAction={openAddDepartment} />}
          />
        </div>
      );
    }

    if (tab === 'staff') {
      return (
        <div>
          <form onSubmit={saveStaffPage} className="p-6 space-y-4 border-b border-[var(--border)]">
            <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">Edit the title and introduction shown at the top of the public Staff page.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Page title" required value={staffPageForm.title} onChange={(e) => editStaffPage((page) => ({ ...page, title: e.target.value }))} />
              <Input label="Page introduction" required value={staffPageForm.intro} onChange={(e) => editStaffPage((page) => ({ ...page, intro: e.target.value }))} />
            </div>
            <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save Staff Page Content</Button>
          </form>
          <DataTable
            columns={[
              { key: 'photo', header: t('photo'), render: (s) => <Thumb src={s.photo} alt={s.name} round /> },
              { key: 'name', header: t('name') },
              { key: 'role', header: t('role') },
              { key: 'department', header: t('department') },
              actionCol(openEditStaff, 'name'),
            ]}
            data={staff}
            emptyState={<EmptyState title={t('noStaffFound')} actionLabel={t('addStaffMember')} onAction={openAddStaff} />}
          />
        </div>
      );
    }

    if (tab === 'news') {
      return (
        <div>
          <form onSubmit={saveNewsPage} className="p-6 space-y-4 border-b border-[var(--border)]">
            <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">Edit the title and introduction shown at the top of the public News page.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Page title" required value={newsPageForm.title} onChange={(e) => editNewsPage((page) => ({ ...page, title: e.target.value }))} />
              <Input label="Page introduction" required value={newsPageForm.intro} onChange={(e) => editNewsPage((page) => ({ ...page, intro: e.target.value }))} />
            </div>
            <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save News Page Content</Button>
          </form>
          <DataTable
            columns={[
              { key: 'image', header: t('photo'), render: (n) => <Thumb src={n.image} alt={n.title} /> },
              { key: 'title', header: t('title') },
              { key: 'date', header: t('date'), render: (n) => new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
              actionCol(openEditNews, 'title'),
            ]}
            data={news}
            rowKey="slug"
            emptyState={<EmptyState title={t('noNewsArticles')} actionLabel={t('addArticle')} onAction={openAddNews} />}
          />
        </div>
      );
    }

    if (tab === 'events') {
      return (
        <div>
          <p className="p-6 text-sm font-medium leading-relaxed text-[var(--color-dark-gray)] border-b border-[var(--border)]">Create and publish events shown on the public Events page.</p>
          <DataTable
            columns={[
              { key: 'title', header: t('title') },
              { key: 'startDate', header: 'Date', render: (ev) => new Date(ev.startDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
              { key: 'location', header: 'Location' },
              actionCol(openEditEvent, 'title'),
            ]}
            data={events}
            emptyState={<EmptyState title="No events created yet" actionLabel="Add event" onAction={openAddEvent} />}
          />
        </div>
      );
    }

    if (tab === 'gallery') {
      return (
        <div>
          <form onSubmit={saveGalleryPage} className="p-6 space-y-4 border-b border-[var(--border)]">
            <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">Edit the title and introduction shown at the top of the public Gallery page.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Page title" required value={galleryPageForm.title} onChange={(e) => editGalleryPage((page) => ({ ...page, title: e.target.value }))} />
              <Input label="Page introduction" required value={galleryPageForm.intro} onChange={(e) => editGalleryPage((page) => ({ ...page, intro: e.target.value }))} />
            </div>
            <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save Gallery Page Content</Button>
          </form>
          <DataTable
            columns={[
              { key: 'image', header: t('photo'), render: (g) => <Thumb src={g.image} alt={g.caption} /> },
              { key: 'caption', header: t('caption') },
              actionCol(openEditGallery, 'caption'),
            ]}
            data={gallery}
            emptyState={<EmptyState title={t('noGalleryImages')} actionLabel={t('addImage')} onAction={openAddGallery} />}
          />
        </div>
      );
    }

    if (tab === 'admissions') {
      return (
        <form onSubmit={saveAdmissions} className="p-6 space-y-5 max-w-3xl">
          <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">
            {t('admissionsEditorDescription')}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Page title" required value={admissionsForm.title} onChange={(e) => editAdmissions((a) => ({ ...a, title: e.target.value }))} />
            <Input label="Page introduction" required value={admissionsForm.intro} onChange={(e) => editAdmissions((a) => ({ ...a, intro: e.target.value }))} />
          </div>
          <Input label="Information heading" required value={admissionsForm.informationTitle} onChange={(e) => editAdmissions((a) => ({ ...a, informationTitle: e.target.value }))} />
          <Input label="Information introduction" required value={admissionsForm.informationIntro} onChange={(e) => editAdmissions((a) => ({ ...a, informationIntro: e.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3"><Input label="Requirements heading" required value={admissionsForm.requirementsTitle} onChange={(e) => editAdmissions((a) => ({ ...a, requirementsTitle: e.target.value }))} /><Input label="Requirements introduction" required value={admissionsForm.requirementsIntro} onChange={(e) => editAdmissions((a) => ({ ...a, requirementsIntro: e.target.value }))} /><Input label="Requirements card title" required value={admissionsForm.requirementsCardTitle} onChange={(e) => editAdmissions((a) => ({ ...a, requirementsCardTitle: e.target.value }))} /></div>
            <div className="space-y-3"><Input label="Dates heading" required value={admissionsForm.datesTitle} onChange={(e) => editAdmissions((a) => ({ ...a, datesTitle: e.target.value }))} /><Input label="Dates introduction" required value={admissionsForm.datesIntro} onChange={(e) => editAdmissions((a) => ({ ...a, datesIntro: e.target.value }))} /><Input label="Dates card title" required value={admissionsForm.datesCardTitle} onChange={(e) => editAdmissions((a) => ({ ...a, datesCardTitle: e.target.value }))} /></div>
          </div>
          <Textarea label={t('requirementsOnePerLine')} required rows={5} value={admissionsForm.requirements} onChange={(e) => editAdmissions((a) => ({ ...a, requirements: e.target.value }))} />
          <Textarea label={t('importantDatesOnePerLine')} required rows={5} value={admissionsForm.dates} onChange={(e) => editAdmissions((a) => ({ ...a, dates: e.target.value }))} />
          <Textarea label={t('admissionProcessParagraph')} required rows={3} value={admissionsForm.process} onChange={(e) => editAdmissions((a) => ({ ...a, process: e.target.value }))} />
          <Input label={t('contactLine')} required value={admissionsForm.contactLine} onChange={(e) => editAdmissions((a) => ({ ...a, contactLine: e.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3"><Input label="Process heading" required value={admissionsForm.processTitle} onChange={(e) => editAdmissions((a) => ({ ...a, processTitle: e.target.value }))} /><Input label="Process introduction" required value={admissionsForm.processIntro} onChange={(e) => editAdmissions((a) => ({ ...a, processIntro: e.target.value }))} /><Input label="Process card title" required value={admissionsForm.processCardTitle} onChange={(e) => editAdmissions((a) => ({ ...a, processCardTitle: e.target.value }))} /></div>
            <div className="space-y-3"><Input label="Support heading" required value={admissionsForm.supportTitle} onChange={(e) => editAdmissions((a) => ({ ...a, supportTitle: e.target.value }))} /><Input label="Support introduction" required value={admissionsForm.supportIntro} onChange={(e) => editAdmissions((a) => ({ ...a, supportIntro: e.target.value }))} /><Input label="Support card title" required value={admissionsForm.supportCardTitle} onChange={(e) => editAdmissions((a) => ({ ...a, supportCardTitle: e.target.value }))} /></div>
          </div>
          <Input label="Application heading" required value={admissionsForm.applicationTitle} onChange={(e) => editAdmissions((a) => ({ ...a, applicationTitle: e.target.value }))} />
          <Input label="Application introduction" required value={admissionsForm.applicationIntro} onChange={(e) => editAdmissions((a) => ({ ...a, applicationIntro: e.target.value }))} />
          <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>{t('saveAdmissionsContent')}</Button>
        </form>
      );
    }

    if (tab === 'developers') {
      return (
        <form onSubmit={saveDevelopersPage} className="p-6 md:p-8 space-y-8 max-w-5xl">
          <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-[linear-gradient(135deg,var(--color-soft-gray),rgba(185,130,45,0.06))] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-gold)]">Public page content</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-[var(--color-dark-gray)]">Developers page</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-mid-gray)]">Control the page linked from the public footer. Changes are published when you save this form.</p>
          </div>
          <section className="space-y-4">
            <div><h3 className="font-display text-base font-semibold text-[var(--text-primary)]">Page introduction</h3><p className="mt-1 text-xs text-[var(--text-secondary)]">Set the title and opening message visitors see first.</p></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Page title" required value={developersPageForm.title} onChange={(e) => editDevelopersPage((page) => ({ ...page, title: e.target.value }))} />
            <Input label="Team label" required value={developersPageForm.teamLabel} onChange={(e) => editDevelopersPage((page) => ({ ...page, teamLabel: e.target.value }))} />
          </div>
          <Textarea label="Page introduction" required rows={2} value={developersPageForm.intro} onChange={(e) => editDevelopersPage((page) => ({ ...page, intro: e.target.value }))} />
          <Input label="Main heading" required value={developersPageForm.heading} onChange={(e) => editDevelopersPage((page) => ({ ...page, heading: e.target.value }))} />
          <Textarea label="Main description" required rows={3} value={developersPageForm.description} onChange={(e) => editDevelopersPage((page) => ({ ...page, description: e.target.value }))} />
          </section>
          <section className="space-y-4 border-t border-[var(--border)] pt-7">
            <div><h3 className="font-display text-base font-semibold text-[var(--text-primary)]">Development team</h3><p className="mt-1 text-xs text-[var(--text-secondary)]">Update each person&apos;s name and role shown on the public page.</p></div>
            {(developersPageForm.developers || []).map((developer, index) => (
              <div key={index} className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,34,30,0.96),rgba(8,22,20,0.96))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.18)] md:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-gold)] text-[11px] font-bold text-[var(--color-deep-green)]">{index + 1}</span>
                    <h4 className="font-display text-lg font-semibold text-[var(--text-primary)]">Developer {index + 1}</h4>
                  </div>
                </div>
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-3">
                    <ImageField
                      label="Profile picture"
                      value={developer.photo || ''}
                      onChange={(photo) => editDevelopersPage((page) => ({ ...page, developers: page.developers.map((item, itemIndex) => itemIndex === index ? { ...item, photo } : item) }))}
                      hint="Use a clear professional headshot."
                      maxDimension={800}
                      preserveTransparency={false}
                      dark
                    />
                  </div>
                  <div className="space-y-4">
                    <Input kind="lettersOnly"
                      label={`Developer ${index + 1} name`}
                      required
                      value={developer.name}
                      onChange={(e) => editDevelopersPage((page) => ({ ...page, developers: page.developers.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item) }))}
                      className="h-12 text-base"
                      dark
                    />
                    <Input kind="lettersOnly"
                      label="Role"
                      required
                      value={developer.role}
                      onChange={(e) => editDevelopersPage((page) => ({ ...page, developers: page.developers.map((item, itemIndex) => itemIndex === index ? { ...item, role: e.target.value } : item) }))}
                      className="h-12 text-base"
                      dark
                    />
                  </div>
                </div>
                <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-2 xl:grid-cols-5">
                  <Input label="Facebook" type="url" value={developer.socials?.facebook || ''} onChange={(e) => editDevelopersPage((page) => ({ ...page, developers: page.developers.map((item, itemIndex) => itemIndex === index ? { ...item, socials: { ...(item.socials || {}), facebook: e.target.value } } : item) }))} placeholder="https://facebook.com/..." className="h-11" dark />
                  <Input label="Instagram" type="url" value={developer.socials?.instagram || ''} onChange={(e) => editDevelopersPage((page) => ({ ...page, developers: page.developers.map((item, itemIndex) => itemIndex === index ? { ...item, socials: { ...(item.socials || {}), instagram: e.target.value } } : item) }))} placeholder="https://instagram.com/..." className="h-11" dark />
                  <Input label="WhatsApp" type="url" value={developer.socials?.whatsapp || ''} onChange={(e) => editDevelopersPage((page) => ({ ...page, developers: page.developers.map((item, itemIndex) => itemIndex === index ? { ...item, socials: { ...(item.socials || {}), whatsapp: e.target.value } } : item) }))} placeholder="https://wa.me/..." className="h-11" dark />
                  <Input label="Twitter" type="url" value={developer.socials?.twitter || ''} onChange={(e) => editDevelopersPage((page) => ({ ...page, developers: page.developers.map((item, itemIndex) => itemIndex === index ? { ...item, socials: { ...(item.socials || {}), twitter: e.target.value } } : item) }))} placeholder="https://x.com/..." className="h-11" dark />
                  <Input label="GitHub" type="url" value={developer.socials?.github || ''} onChange={(e) => editDevelopersPage((page) => ({ ...page, developers: page.developers.map((item, itemIndex) => itemIndex === index ? { ...item, socials: { ...(item.socials || {}), github: e.target.value } } : item) }))} placeholder="https://github.com/..." className="h-11" dark />
                </div>
              </div>
            ))}
          </section>
          <section className="space-y-4 border-t border-[var(--border)] pt-7">
            <div><h3 className="font-display text-base font-semibold text-[var(--text-primary)]">What was built</h3><p className="mt-1 text-xs text-[var(--text-secondary)]">Describe the main parts of the website and management system.</p></div>
            {(developersPageForm.capabilities || []).map((capability, index) => (
              <div key={index} className="rounded-xl border border-[var(--border)] bg-[var(--color-soft-gray)] p-4 space-y-3">
                <Input label={`Capability ${index + 1}`} required value={capability.label} onChange={(e) => editDevelopersPage((page) => ({ ...page, capabilities: page.capabilities.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item) }))} />
                <Textarea label="Description" required rows={2} value={capability.detail} onChange={(e) => editDevelopersPage((page) => ({ ...page, capabilities: page.capabilities.map((item, itemIndex) => itemIndex === index ? { ...item, detail: e.target.value } : item) }))} />
              </div>
            ))}
          </section>
          <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-6">
            <p className="text-xs text-[var(--text-secondary)]">These changes update the public Developers page and footer destination.</p>
            <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save Developers Page</Button>
          </div>
        </form>
      );
    }

    if (tab === 'contact') {
      return (
        <div>
          <form onSubmit={saveContactPage} className="p-6 space-y-4 border-b border-[var(--border)] max-w-3xl">
            <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">Edit the public Contact Us page heading and introduction.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Page title" required value={contactPageForm.title} onChange={(e) => editContactPage((page) => ({ ...page, title: e.target.value }))} />
              <Input label="Page introduction" required value={contactPageForm.intro} onChange={(e) => editContactPage((page) => ({ ...page, intro: e.target.value }))} />
            </div>
            <Input label="Information heading" required value={contactPageForm.informationTitle} onChange={(e) => editContactPage((page) => ({ ...page, informationTitle: e.target.value }))} />
            <Input label="Information introduction" required value={contactPageForm.informationIntro} onChange={(e) => editContactPage((page) => ({ ...page, informationIntro: e.target.value }))} />
            <div className="space-y-4 rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-soft-gray)] p-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">Developer Attribution</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-mid-gray)]">The footer link opens the internal Developers page, which displays these names. The link destination is managed by the website.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input kind="name" label="Developer name" value={contactPageForm.developerName || ''} onChange={(e) => editContactPage((page) => ({ ...page, developerName: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>Save Contact Us Page Content</Button>
          </form>
          <form onSubmit={saveContact} className="p-6 space-y-5 max-w-3xl">
          <p className="text-sm font-medium leading-relaxed text-[var(--color-dark-gray)]">
            {t('contactEditorDescription')}
          </p>
          <Textarea label={t('address')} required value={contactForm.address} onChange={(e) => editContact((c) => ({ ...c, address: e.target.value }))} />
          <Input kind="phone" label={t('phone')} required value={contactForm.phone} onChange={(e) => editContact((c) => ({ ...c, phone: e.target.value }))} />
          <Input kind="email" label={t('email')} required type="email" value={contactForm.email} onChange={(e) => editContact((c) => ({ ...c, email: e.target.value }))} />
          <Input label={t('mapSearchQuery')} required value={contactForm.mapQuery} onChange={(e) => editContact((c) => ({ ...c, mapQuery: e.target.value }))} hint={t('mapLocationHint')} />
          <Button type="submit" variant="primary" icon={Save} loading={savingSingle}>{t('saveContactInfo')}</Button>
          </form>
        </div>
      );
    }

    // images
    return <SiteImagesPanel user={user} notify={notify} notifyError={notifyError} bumpActivity={bumpActivity} />;
  };

  const isListTab = ['programs', 'departments', 'staff', 'news', 'events', 'gallery'].includes(tab);
  const currentSection = ALL_SECTIONS.find((s) => s.value === tab);
  const addHandlers = { programs: openAddProgram, departments: openAddDepartment, staff: openAddStaff, news: openAddNews, events: openAddEvent, gallery: openAddGallery };
  const submitHandlers = { programs: submitProgram, departments: submitDepartment, staff: submitStaff, news: submitNews, events: submitEvent, gallery: submitGallery };
  const fieldSets = { programs: programFields, departments: departmentFields, staff: staffFields, news: newsFields, events: eventFields, gallery: galleryFields };
  const modalTitles = {
    programs: formModal.mode === 'add' ? 'Add Program' : 'Edit Program',
    departments: formModal.mode === 'add' ? 'Add Department' : 'Edit Department',
    staff: formModal.mode === 'add' ? 'Add Staff Member' : 'Edit Staff Member',
    news: formModal.mode === 'add' ? 'Add News Article' : 'Edit News Article',
    events: formModal.mode === 'add' ? 'Add Event' : 'Edit Event',
    gallery: formModal.mode === 'add' ? 'Add Gallery Image' : 'Edit Gallery Image',
  };

  return (
    <div>
      <PageHeader
        title={t('websiteManagement')}
        description={t('websiteManagementDescription')}
        breadcrumb={[{ label: t('admin'), to: '/admin' }, { label: t('website') }]}
        actions={
          <>
            <Link to="/admin/activity">
              <Button variant="secondary" icon={History}>{t('allWebsiteActivity')}</Button>
            </Link>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" icon={ExternalLink}>{t('viewSite')}</Button>
            </a>
            {isListTab && <Button icon={Plus} onClick={addHandlers[tab]}>{t('add')}</Button>}
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
            events: events.length,
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
                  {websiteText(t, currentSection.label)}
                </h2>
                <p className="text-xs font-medium text-[var(--text-secondary)] truncate">{websiteText(t, currentSection.description)}</p>
              </div>
            </div>
          )}
          {renderTab()}
        </div>
      </div>

      <div className="mt-6 bg-[var(--surface)] rounded-[1.5rem] border border-[var(--border)] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-[var(--text-primary)]">
            <History className="w-4 h-4 text-[var(--color-gold)]" aria-hidden="true" /> {t('recentWebsiteActions')}
          </h2>
          <Link to="/admin/activity" className="text-xs font-semibold text-[var(--text-secondary)] hover:underline">
            {t('viewFullAuditLog')}
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-[var(--color-mid-gray)]">{t('noWebsiteActions')}</p>
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
        title={t('deleteItemQuestion')}
        message={`This will permanently remove "${deleteHandlers[tab]?.label(deleteTarget)}" from the public website. This cannot be undone.`}
        confirmLabel={t('delete')}
        variant="danger"
      />
    </div>
  );
}
