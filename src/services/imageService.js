import { useEffect, useState } from 'react';
import { api } from './api';
import { IMAGES } from '../data/images';
import { logActivity } from './activityService';

export const IMAGE_SLOTS = [
  { path: 'login.background', label: 'Login Background Photo', group: 'Login Page', default: IMAGES.home.heroSlides[0] },
  { path: 'login.form', label: 'Login Form Photo', group: 'Login Page', default: IMAGES.about.campus },
  ...IMAGES.home.heroSlides.map((url, index) => ({ path: `home.heroSlides.${index}`, label: `Hero Photo ${index + 1}`, group: 'Home Page', default: url })),
  ...IMAGES.home.gallery.map((url, index) => ({ path: `home.gallery.${index}`, label: `Preview Photo ${index + 1}`, group: 'Home Page', default: url })),
  { path: 'about.campus', label: 'Campus Photo', group: 'About Page', default: IMAGES.about.campus },
  { path: 'about.leadership', label: 'Leadership Photo', group: 'About Page', default: IMAGES.about.leadership },
  ...Object.entries(IMAGES.about.facilities).map(([key, url]) => ({ path: `about.facilities.${key}`, label: `${key} facility`, group: 'About Page - Facilities', default: url })),
  { path: 'pageHeroes.academics', label: 'Academics Banner Photo', group: 'Page Banners', default: IMAGES.pageHeroes.academics },
  { path: 'pageHeroes.departments', label: 'Departments Banner Photo', group: 'Page Banners', default: IMAGES.pageHeroes.departments },
  { path: 'pageHeroes.staff', label: 'Staff Banner Photo', group: 'Page Banners', default: IMAGES.pageHeroes.staff },
  { path: 'pageHeroes.news', label: 'News Banner Photo', group: 'Page Banners', default: IMAGES.pageHeroes.news },
  { path: 'pageHeroes.gallery', label: 'Gallery Banner Photo', group: 'Page Banners', default: IMAGES.pageHeroes.gallery },
  { path: 'pageHeroes.contact', label: 'Contact Banner Photo', group: 'Page Banners', default: IMAGES.pageHeroes.contact },
  { path: 'admissions.hero', label: 'Admissions Banner Photo', group: 'Admissions Page', default: IMAGES.admissions.hero },
];
let overrides = {};

export async function uploadImage(dataUrl, folder) {
  if (!dataUrl?.startsWith('data:')) return { imageUrl: dataUrl, publicId: '' };
  const [meta, encoded] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  const form = new FormData(); form.append('image', new Blob([bytes], { type: mime }), 'upload'); form.append('folder', folder);
  const result = await api.post('/uploads', form);
  return result.data;
}

export async function refreshSiteImages() {
  try { const result = await api.get('/public/settings'); overrides = result.data?.siteImages || {}; window.dispatchEvent(new Event('rg:images-updated')); } catch { /* defaults remain available */ }
  return overrides;
}
if (typeof window !== 'undefined') { refreshSiteImages(); window.addEventListener('rg:authenticated', () => { refreshSiteImages(); }); }
// Same rationale as useContentVersion in contentService.js: getSiteImage/
// getSiteImageSlots read a plain in-memory cache that fills in after this
// module's initial async fetch. Call this hook anywhere that reads them so
// the component re-renders once real images (or an admin's edit) arrive.
export function useSiteImageVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('rg:images-updated', bump);
    return () => window.removeEventListener('rg:images-updated', bump);
  }, []);
  return version;
}
export function getSiteImage(path) { return overrides[path] || IMAGE_SLOTS.find((slot) => slot.path === path)?.default || ''; }
export function getSiteImageSlots() { return IMAGE_SLOTS.map((slot) => ({ ...slot, url: getSiteImage(slot.path), isCustom: Boolean(overrides[slot.path]) })); }
export async function updateSiteImage(path, url, actor) {
  if (!url?.trim()) return { success: false, error: 'Please choose a photo.' };
  try { const image = await uploadImage(url.trim(), 'rambura-garcons/site'); overrides = { ...overrides, [path]: image.imageUrl }; await api.put('/admin/settings', { siteImages: overrides }); window.dispatchEvent(new Event('rg:images-updated')); logActivity({ user: actor?.fullName || actor?.username, action: `Changed image - ${path}`, module: 'Website' }); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}
export async function resetSiteImage(path, actor) {
  try { const next = { ...overrides }; delete next[path]; overrides = next; await api.put('/admin/settings', { siteImages: next }); window.dispatchEvent(new Event('rg:images-updated')); logActivity({ user: actor?.fullName || actor?.username, action: `Reset image - ${path}`, module: 'Website', status: 'warning' }); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}
