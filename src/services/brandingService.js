import { api } from './api';
import { logActivity } from './activityService';

export const BRANDING_EVENT = 'rg:branding-updated';
let branding = { logoUrl: '' };

async function uploadLogo(dataUrl) {
  if (!dataUrl.startsWith('data:')) return { imageUrl: dataUrl };
  const [meta, encoded] = dataUrl.split(','); const mime = meta.match(/data:(.*?);/)?.[1] || 'image/png';
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0)); const form = new FormData();
  form.append('image', new Blob([bytes], { type: mime }), 'logo'); form.append('folder', 'rambura-garcons/branding');
  const result = await api.post('/uploads', form); return result.data;
}

export async function refreshBranding() {
  try {
    const result = await api.get('/public/settings');
    const logo = result.data?.logo;
    branding = { logoUrl: typeof logo === 'string' ? logo : logo?.imageUrl || '' };
    window.dispatchEvent(new Event(BRANDING_EVENT));
  } catch { /* public pages retain the empty logo fallback until the API is available */ }
  return branding;
}
if (typeof window !== 'undefined') { refreshBranding(); window.addEventListener('rg:authenticated', () => { refreshBranding(); }); }
export function getBranding() { return branding; }
export async function updateSiteLogo(dataUrl, actor) {
  if (!dataUrl) return { success: false, error: 'Please choose a logo image.' };
  try { const image = await uploadLogo(dataUrl); await api.put('/admin/settings', { logo: image }); branding = { logoUrl: image.imageUrl }; window.dispatchEvent(new Event(BRANDING_EVENT)); logActivity({ user: actor?.fullName || actor?.username, action: 'Changed the school logo', module: 'Website' }); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}
export async function resetSiteLogo(actor) {
  try { await api.put('/admin/settings', { logo: { imageUrl: '' } }); branding = { logoUrl: '' }; window.dispatchEvent(new Event(BRANDING_EVENT)); logActivity({ user: actor?.fullName || actor?.username, action: 'Reset the school logo', module: 'Website', status: 'warning' }); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}
