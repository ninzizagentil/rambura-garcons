/**
 * contentService — the single source of truth for every piece of content
 * shown on the public website (Home, About, Academics, Departments, Staff,
 * News, Gallery, Admissions, Contact).
 *
 * WHY THIS FILE EXISTS
 * ─────────────────────────────────────────────────────────────────────────
 * Before this file, each public page imported its own hard-coded array from
 * data/content.js. That meant the Website Management admin screen could
 * only *pretend* to edit content (a toast that said "Saved!" but changed
 * nothing on the real site).
 *
 * Now every public page reads through the getters below, and every admin
 * action (create / update / delete) goes through the matching function
 * here. Because both sides read/write the same localStorage-backed
 * collection, anything an admin changes in Website Management shows up
 * immediately on the live public pages — this is a real, working CMS.
 *
 * Every mutating function also calls logActivity(), so every action taken
 * from the admin panel appears in Activity / Audit automatically.
 */
import { loadCollection, saveCollection, genId } from '../utils/storage';
import { logActivity } from './activityService';
import { PROGRAMS as SEED_PROGRAMS, DEPARTMENTS as SEED_DEPARTMENTS, STAFF as SEED_STAFF, NEWS as SEED_NEWS, GALLERY as SEED_GALLERY } from '../data/content';
import { IMAGES } from '../data/images';

// Attach each item's current photo (from the central image config) as an
// `image`/`photo` field on the seed data, so every content item carries its
// own picture and Website Management can edit it right alongside the text.
const SEED_PROGRAMS_WITH_IMAGES = SEED_PROGRAMS.map((p) => ({ ...p, image: IMAGES.programs[p.slug] || '' }));
const SEED_DEPARTMENTS_WITH_IMAGES = SEED_DEPARTMENTS.map((d) => ({ ...d, image: IMAGES.departments[d.slug] || '' }));
const SEED_STAFF_WITH_IMAGES = SEED_STAFF.map((s) => ({ ...s, photo: IMAGES.staff[s.id] || '' }));
const SEED_NEWS_WITH_IMAGES = SEED_NEWS.map((n) => ({ ...n, image: IMAGES.news[n.slug] || '' }));
const SEED_GALLERY_WITH_IMAGES = SEED_GALLERY.map((g) => ({ ...g, image: IMAGES.gallery[g.id] || '' }));

const KEYS = {
  hero: 'rg_content_hero',
  programs: 'rg_content_programs',
  departments: 'rg_content_departments',
  staff: 'rg_content_staff',
  news: 'rg_content_news',
  gallery: 'rg_content_gallery',
  admissions: 'rg_content_admissions',
  contact: 'rg_content_contact',
};

const SEED_HERO = {
  eyebrow: 'Nyabihu District · TVET School',
  title: "Skilled hands. Disciplined minds. Built on Nyabihu's hills.",
  subtitle:
    "Rambura Garçons trains the electricians, welders, builders, and mechanics who will carry Rwanda's trades forward — through rigorous, hands-on technical and vocational education.",
  stats: [
    { label: 'Students', value: '640+' },
    { label: 'Trade Programs', value: '4' },
    { label: 'Years of Formation', value: '18' },
    { label: 'Graduate Placement', value: '92%' },
  ],
};

const SEED_ADMISSIONS = {
  intro: 'Everything you need to apply to Rambura Garçons.',
  requirements: [
    'Completed Ordinary Level (S3) certificate or equivalent',
    'Copy of national ID or birth certificate',
    'Two passport photographs',
    'Medical fitness certificate',
  ],
  dates: [
    'Applications open: July 10',
    'Applications close: September 15',
    'Entrance interviews: September 22–26',
    'Term begins: October 6',
  ],
  process:
    'Submit the application form, attend a short entrance interview, and receive your placement letter by email within two weeks.',
  contactLine: 'admissions@ramburagarcons.rw · +250 788 000 000',
};

const SEED_CONTACT = {
  address: 'Rambura Sector, Nyabihu District, Western Province, Rwanda',
  phone: '+250 788 000 000',
  email: 'info@ramburagarcons.rw',
  mapQuery: 'Rambura,Nyabihu+District,Rwanda',
};

function actorName(actor) {
  return actor?.name || actor?.username || 'System';
}

/* ───────────────────────── Home hero + stats ───────────────────────── */

export function getHero() {
  return loadCollection(KEYS.hero, SEED_HERO);
}

export function updateHero(updates, actor) {
  const current = loadCollection(KEYS.hero, SEED_HERO);
  const next = { ...current, ...updates };
  saveCollection(KEYS.hero, next);
  logActivity({ user: actorName(actor), action: 'Updated homepage hero content', module: 'Website' });
  return { success: true, hero: next };
}

/* ──────────────────────────── Programs ─────────────────────────────── */

export function getPrograms() {
  return loadCollection(KEYS.programs, SEED_PROGRAMS_WITH_IMAGES);
}

export function createProgram(data, actor) {
  const items = loadCollection(KEYS.programs, SEED_PROGRAMS_WITH_IMAGES);
  const slug = data.slug || data.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (items.some((p) => p.slug === slug)) {
    return { success: false, error: 'A program with this slug already exists.' };
  }
  const newItem = { ...data, slug };
  saveCollection(KEYS.programs, [newItem, ...items]);
  logActivity({ user: actorName(actor), action: `Added program "${data.title}"`, module: 'Website' });
  return { success: true, item: newItem };
}

export function updateProgram(slug, updates, actor) {
  const items = loadCollection(KEYS.programs, SEED_PROGRAMS_WITH_IMAGES);
  const next = items.map((p) => (p.slug === slug ? { ...p, ...updates } : p));
  saveCollection(KEYS.programs, next);
  logActivity({ user: actorName(actor), action: `Updated program "${updates.title || slug}"`, module: 'Website' });
  return { success: true };
}

export function deleteProgram(slug, actor) {
  const items = loadCollection(KEYS.programs, SEED_PROGRAMS_WITH_IMAGES);
  const removed = items.find((p) => p.slug === slug);
  saveCollection(KEYS.programs, items.filter((p) => p.slug !== slug));
  logActivity({ user: actorName(actor), action: `Deleted program "${removed?.title || slug}"`, module: 'Website', status: 'warning' });
  return { success: true };
}

/* ─────────────────────────── Departments ───────────────────────────── */

export function getDepartments() {
  return loadCollection(KEYS.departments, SEED_DEPARTMENTS_WITH_IMAGES);
}

export function createDepartment(data, actor) {
  const items = loadCollection(KEYS.departments, SEED_DEPARTMENTS_WITH_IMAGES);
  const slug = data.slug || data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (items.some((d) => d.slug === slug)) {
    return { success: false, error: 'A department with this slug already exists.' };
  }
  const newItem = { ...data, slug };
  saveCollection(KEYS.departments, [newItem, ...items]);
  logActivity({ user: actorName(actor), action: `Added department "${data.name}"`, module: 'Website' });
  return { success: true, item: newItem };
}

export function updateDepartment(slug, updates, actor) {
  const items = loadCollection(KEYS.departments, SEED_DEPARTMENTS_WITH_IMAGES);
  const next = items.map((d) => (d.slug === slug ? { ...d, ...updates } : d));
  saveCollection(KEYS.departments, next);
  logActivity({ user: actorName(actor), action: `Updated department "${updates.name || slug}"`, module: 'Website' });
  return { success: true };
}

export function deleteDepartment(slug, actor) {
  const items = loadCollection(KEYS.departments, SEED_DEPARTMENTS_WITH_IMAGES);
  const removed = items.find((d) => d.slug === slug);
  saveCollection(KEYS.departments, items.filter((d) => d.slug !== slug));
  logActivity({ user: actorName(actor), action: `Deleted department "${removed?.name || slug}"`, module: 'Website', status: 'warning' });
  return { success: true };
}

/* ─────────────────────────────── Staff ─────────────────────────────── */

export function getStaff() {
  return loadCollection(KEYS.staff, SEED_STAFF_WITH_IMAGES);
}

export function createStaffMember(data, actor) {
  const items = loadCollection(KEYS.staff, SEED_STAFF_WITH_IMAGES);
  const newItem = { ...data, id: genId('st') };
  saveCollection(KEYS.staff, [newItem, ...items]);
  logActivity({ user: actorName(actor), action: `Added staff member "${data.name}"`, module: 'Website' });
  return { success: true, item: newItem };
}

export function updateStaffMember(id, updates, actor) {
  const items = loadCollection(KEYS.staff, SEED_STAFF_WITH_IMAGES);
  const next = items.map((s) => (s.id === id ? { ...s, ...updates } : s));
  saveCollection(KEYS.staff, next);
  logActivity({ user: actorName(actor), action: `Updated staff member "${updates.name || id}"`, module: 'Website' });
  return { success: true };
}

export function deleteStaffMember(id, actor) {
  const items = loadCollection(KEYS.staff, SEED_STAFF_WITH_IMAGES);
  const removed = items.find((s) => s.id === id);
  saveCollection(KEYS.staff, items.filter((s) => s.id !== id));
  logActivity({ user: actorName(actor), action: `Removed staff member "${removed?.name || id}"`, module: 'Website', status: 'warning' });
  return { success: true };
}

/* ──────────────────────────────── News ─────────────────────────────── */

export function getNews() {
  return loadCollection(KEYS.news, SEED_NEWS_WITH_IMAGES);
}

export function createNewsArticle(data, actor) {
  const items = loadCollection(KEYS.news, SEED_NEWS_WITH_IMAGES);
  const slug = data.slug || data.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (items.some((n) => n.slug === slug)) {
    return { success: false, error: 'An article with this slug already exists.' };
  }
  const newItem = { ...data, slug };
  saveCollection(KEYS.news, [newItem, ...items]);
  logActivity({ user: actorName(actor), action: `Published news article "${data.title}"`, module: 'Website' });
  return { success: true, item: newItem };
}

export function updateNewsArticle(slug, updates, actor) {
  const items = loadCollection(KEYS.news, SEED_NEWS_WITH_IMAGES);
  const next = items.map((n) => (n.slug === slug ? { ...n, ...updates } : n));
  saveCollection(KEYS.news, next);
  logActivity({ user: actorName(actor), action: `Updated news article "${updates.title || slug}"`, module: 'Website' });
  return { success: true };
}

export function deleteNewsArticle(slug, actor) {
  const items = loadCollection(KEYS.news, SEED_NEWS_WITH_IMAGES);
  const removed = items.find((n) => n.slug === slug);
  saveCollection(KEYS.news, items.filter((n) => n.slug !== slug));
  logActivity({ user: actorName(actor), action: `Deleted news article "${removed?.title || slug}"`, module: 'Website', status: 'warning' });
  return { success: true };
}

/* ─────────────────────────────── Gallery ───────────────────────────── */

export function getGallery() {
  return loadCollection(KEYS.gallery, SEED_GALLERY_WITH_IMAGES);
}

export function createGalleryImage(data, actor) {
  const items = loadCollection(KEYS.gallery, SEED_GALLERY_WITH_IMAGES);
  const newItem = { ...data, id: genId('g') };
  saveCollection(KEYS.gallery, [newItem, ...items]);
  logActivity({ user: actorName(actor), action: `Added gallery image "${data.caption}"`, module: 'Website' });
  return { success: true, item: newItem };
}

export function updateGalleryImage(id, updates, actor) {
  const items = loadCollection(KEYS.gallery, SEED_GALLERY_WITH_IMAGES);
  const next = items.map((g) => (g.id === id ? { ...g, ...updates } : g));
  saveCollection(KEYS.gallery, next);
  logActivity({ user: actorName(actor), action: `Updated gallery image "${updates.caption || id}"`, module: 'Website' });
  return { success: true };
}

export function deleteGalleryImage(id, actor) {
  const items = loadCollection(KEYS.gallery, SEED_GALLERY_WITH_IMAGES);
  const removed = items.find((g) => g.id === id);
  saveCollection(KEYS.gallery, items.filter((g) => g.id !== id));
  logActivity({ user: actorName(actor), action: `Deleted gallery image "${removed?.caption || id}"`, module: 'Website', status: 'warning' });
  return { success: true };
}

/* ────────────────────────────── Admissions ─────────────────────────── */

export function getAdmissionsInfo() {
  return loadCollection(KEYS.admissions, SEED_ADMISSIONS);
}

export function updateAdmissionsInfo(updates, actor) {
  const current = loadCollection(KEYS.admissions, SEED_ADMISSIONS);
  const next = { ...current, ...updates };
  saveCollection(KEYS.admissions, next);
  logActivity({ user: actorName(actor), action: 'Updated admissions page content', module: 'Website' });
  return { success: true, info: next };
}

/* ─────────────────────────────── Contact ───────────────────────────── */

export function getContactInfo() {
  return loadCollection(KEYS.contact, SEED_CONTACT);
}

export function updateContactInfo(updates, actor) {
  const current = loadCollection(KEYS.contact, SEED_CONTACT);
  const next = { ...current, ...updates };
  saveCollection(KEYS.contact, next);
  logActivity({ user: actorName(actor), action: 'Updated contact page information', module: 'Website' });
  return { success: true, info: next };
}
