/**
 * imageService — manages every "fixed" photo on the public website that
 * isn't already covered by a content list (Programs, Departments, Staff,
 * News, and Gallery each carry their own `image`/`photo` field, edited
 * directly on that item in Website Management).
 *
 * A "fixed" image is one that belongs to a page itself rather than to a
 * list item — the Home hero photo, the four small preview photos under it,
 * the About page's campus/leadership/facility photos, and the Admissions
 * banner photo.
 *
 * Every slot has a sensible default (the original photo from
 * data/images.js). Saving a new URL here overrides that default; "Reset to
 * default" removes the override and the original photo comes back.
 */
import { loadCollection, saveCollection } from '../utils/storage';
import { logActivity } from './activityService';
import { IMAGES } from '../data/images';

const KEY = 'rg_content_site_images';

export const IMAGE_SLOTS = [
  { path: 'home.hero', label: 'Hero Photo', group: 'Home Page', default: IMAGES.home.hero },
  { path: 'home.gallery.0', label: 'Preview Photo 1', group: 'Home Page', default: IMAGES.home.gallery[0] },
  { path: 'home.gallery.1', label: 'Preview Photo 2', group: 'Home Page', default: IMAGES.home.gallery[1] },
  { path: 'home.gallery.2', label: 'Preview Photo 3', group: 'Home Page', default: IMAGES.home.gallery[2] },
  { path: 'home.gallery.3', label: 'Preview Photo 4', group: 'Home Page', default: IMAGES.home.gallery[3] },
  { path: 'about.campus', label: 'Campus Photo', group: 'About Page', default: IMAGES.about.campus },
  { path: 'about.leadership', label: 'Leadership Photo', group: 'About Page', default: IMAGES.about.leadership },
  { path: 'about.facilities.electrical', label: 'Electrical Workshop', group: 'About Page — Facilities', default: IMAGES.about.facilities.electrical },
  { path: 'about.facilities.welding', label: 'Welding & Fabrication Bay', group: 'About Page — Facilities', default: IMAGES.about.facilities.welding },
  { path: 'about.facilities.construction', label: 'Construction Training Yard', group: 'About Page — Facilities', default: IMAGES.about.facilities.construction },
  { path: 'about.facilities.automobile', label: 'Automobile Garage', group: 'About Page — Facilities', default: IMAGES.about.facilities.automobile },
  { path: 'about.facilities.library', label: 'Library & Reading Hall', group: 'About Page — Facilities', default: IMAGES.about.facilities.library },
  { path: 'about.facilities.dormitories', label: 'Boarding Dormitories', group: 'About Page — Facilities', default: IMAGES.about.facilities.dormitories },
  { path: 'admissions.hero', label: 'Admissions Banner Photo', group: 'Admissions Page', default: IMAGES.admissions.hero },
];

function loadOverrides() {
  return loadCollection(KEY, {});
}

function actorName(actor) {
  return actor?.name || actor?.username || 'System';
}

/** Resolves the *current* photo for a slot — the admin's override if set, otherwise the default. */
export function getSiteImage(path) {
  const overrides = loadOverrides();
  if (overrides[path]) return overrides[path];
  const slot = IMAGE_SLOTS.find((s) => s.path === path);
  return slot ? slot.default : '';
}

/** All slots with their current effective URL, for rendering the admin Images tab. */
export function getSiteImageSlots() {
  const overrides = loadOverrides();
  return IMAGE_SLOTS.map((s) => ({ ...s, url: overrides[s.path] || s.default, isCustom: !!overrides[s.path] }));
}

export function updateSiteImage(path, url, actor) {
  if (!url || !url.trim()) {
    return { success: false, error: 'Please choose a photo.' };
  }
  const overrides = loadOverrides();
  overrides[path] = url.trim();
  saveCollection(KEY, overrides);
  const slot = IMAGE_SLOTS.find((s) => s.path === path);
  logActivity({ user: actorName(actor), action: `Changed image — "${slot?.label || path}"`, module: 'Website' });
  return { success: true };
}

export function resetSiteImage(path, actor) {
  const overrides = loadOverrides();
  delete overrides[path];
  saveCollection(KEY, overrides);
  const slot = IMAGE_SLOTS.find((s) => s.path === path);
  logActivity({ user: actorName(actor), action: `Reset image to default — "${slot?.label || path}"`, module: 'Website', status: 'warning' });
  return { success: true };
}
