import { useEffect, useState } from 'react';
import { api } from './api';
import { uploadImage } from './imageService';

// The public site is rendered before its first API request completes. Keep a
// complete hero shape here so an unavailable or still-starting backend cannot
// crash the initial React render (and leave visitors with a blank page).
const DEFAULT_HERO = {
  eyebrow: 'Welcome to Rambura Garçons TVET School',
  title: 'Building Skills. Shaping Futures.',
  subtitle: 'Practical technical education that prepares young people for meaningful careers.',
  stats: [
    { value: '500+', label: 'Students' },
    { value: '4', label: 'Programs' },
    { value: '30+', label: 'Staff' },
    { value: '95%', label: 'Success Rate' },
  ],
};

const cache = { hero: DEFAULT_HERO, programs: [], departments: [], staff: [], news: [], gallery: [], settings: {} };
let loading;
let contentLoaded = false;
export function isContentLoaded() { return contentLoaded; }

function id(value) { return value?.id || value?._id; }
function normalize(item) {
  const value = { ...item, id: id(item) };
  if (value.image && typeof value.image === 'object') value.image = value.image.imageUrl || '';
  if (value.photo && typeof value.photo === 'object') value.photo = value.photo.imageUrl || '';
  value.summary = value.summary || value.description || '';
  value.details = value.details || value.description || '';
  value.bio = value.bio || value.biography || '';
  value.role = value.role || value.position || '';
  value.caption = value.caption || value.title || '';
  return value;
}
function list(result) { return Array.isArray(result.data) ? result.data.map(normalize) : []; }

export async function refreshContent() {
  if (loading) return loading;
  loading = Promise.all([
    api.get('/public/home'), api.get('/public/programs'), api.get('/public/departments'),
    api.get('/public/staff'), api.get('/public/news'), api.get('/public/gallery'), api.get('/public/settings'),
  ]).then(([hero, programs, departments, staff, news, gallery, settings]) => {
    cache.hero = hero.data || {};
    cache.programs = list(programs); cache.departments = list(departments); cache.staff = list(staff);
    cache.news = list(news); cache.gallery = list(gallery); cache.settings = settings.data || {};
    contentLoaded = true;
    window.dispatchEvent(new Event('rg:content-updated'));
    return cache;
  }).finally(() => { loading = null; });
  return loading;
}
if (typeof window !== 'undefined') refreshContent().catch(() => {});

// Every getXxx() below reads a plain in-memory cache that's populated by the
// async refreshContent() above (and updated after every create/update/delete).
// A component that just calls getPrograms() etc. during render captures a
// snapshot at mount time — if the initial fetch hasn't resolved yet (or an
// edit happens later), nothing tells React to re-render, so the page can be
// stuck showing empty/stale content forever. Call this hook in any component
// that reads the content cache so it re-renders whenever the cache changes.
export function useContentVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('rg:content-updated', bump);
    return () => window.removeEventListener('rg:content-updated', bump);
  }, []);
  return version;
}

export function getHero() { return { ...DEFAULT_HERO, ...cache.hero, stats: cache.hero?.stats || DEFAULT_HERO.stats }; }
export function getPrograms() { return cache.programs; }
export function getDepartments() { return cache.departments; }
export function getStaff() { return cache.staff; }
export function getNews() { return cache.news; }
export function getGallery() { return cache.gallery; }
export function getAdmissionsInfo() { return cache.settings.admissions || cache.settings.homepageSettings || { requirements: [], dates: [], process: '', contactLine: '' }; }
export function getAdmissionsSettings() { return getAdmissionsInfo(); }
export function getContactInfo() { return cache.settings.contact || cache.settings.contactSettings || { address: '', phone: '', email: '', mapQuery: '' }; }
export function getContactSettings() { return getContactInfo(); }

async function mutate(method, path, data) {
  try {
    const payload = { ...data };
    // Both "image" (programs/departments/news/gallery) and "photo" (staff) are
    // picture fields — whichever one is present and holds a freshly-picked
    // data: URL needs to be uploaded before it's sent to the API. The folder
    // is derived from the resource in the path so files land in the right
    // Cloudinary bucket instead of always under "news".
    const resource = path.split('/').filter(Boolean)[1] || 'misc';
    for (const key of ['image', 'photo']) {
      if (payload[key]?.startsWith?.('data:')) {
        payload[key] = await uploadImage(payload[key], `rambura-garcons/${resource || 'misc'}`);
      }
    }
    const result = await api[method](path, payload);
    await refreshContent();
    return { success: true, item: normalize(result.data), data: result.data };
  }
  catch (error) { return { success: false, error: error.message }; }
}
export async function updateHero(data) { const result = await mutate('put', '/admin/website/hero', data); return { ...result, hero: result.data || result.item }; }
export function createProgram(data) { return mutate('post', '/admin/programs', data); }
export function updateProgram(idOrSlug, data) { return mutate('put', `/admin/programs/${idOrSlug}`, data); }
export function deleteProgram(idOrSlug) { return mutate('delete', `/admin/programs/${idOrSlug}`, {}); }
export function createDepartment(data) { return mutate('post', '/admin/departments', data); }
export function updateDepartment(idOrSlug, data) { return mutate('put', `/admin/departments/${idOrSlug}`, data); }
export function deleteDepartment(idOrSlug) { return mutate('delete', `/admin/departments/${idOrSlug}`, {}); }
export function createStaffMember(data) { return mutate('post', '/admin/staff', data); }
export function updateStaffMember(id, data) { return mutate('put', `/admin/staff/${id}`, data); }
export function deleteStaffMember(id) { return mutate('delete', `/admin/staff/${id}`, {}); }
export function createNewsArticle(data) { return mutate('post', '/admin/news', data); }
export const createNews = createNewsArticle;
export function updateNewsArticle(idOrSlug, data) { return mutate('put', `/admin/news/${idOrSlug}`, data); }
export const updateNews = updateNewsArticle;
export function deleteNewsArticle(idOrSlug) { return mutate('delete', `/admin/news/${idOrSlug}`, {}); }
export function createGalleryImage(data) { return mutate('post', '/admin/gallery', data); }
export function updateGalleryImage(id, data) { return mutate('put', `/admin/gallery/${id}`, data); }
export function deleteGalleryImage(id) { return mutate('delete', `/admin/gallery/${id}`, {}); }
export function updateAdmissionsInfo(data) { return mutate('put', '/admin/settings', { homepageSettings: data, admissions: data }); }
export const updateAdmissionsSettings = updateAdmissionsInfo;
export function updateContactInfo(data) { return mutate('put', '/admin/settings', { contactSettings: data, contact: data }); }
export const updateContactSettings = updateContactInfo;
export function updatePage(_pageId, data) { return updateHero(data); }
