import Program from '../models/Program.js';
import Department from '../models/Department.js';
import Staff from '../models/Staff.js';
import News from '../models/News.js';
import Gallery from '../models/Gallery.js';
import WebsiteSetting from '../models/WebsiteSetting.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

const resources = { programs: Program, departments: Department, staff: Staff, news: News, gallery: Gallery };
function slugify(value) { return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function frontendShape(item) { const value = item.toObject ? item.toObject() : item; if (value.image?.imageUrl) value.image = value.image.imageUrl; if (value.photo?.imageUrl) value.photo = value.photo.imageUrl; return value; }
// The schema stores pictures as { imageUrl, publicId }, but the frontend
// sends the flattened URL string it already has on file whenever the admin
// didn't pick a brand-new photo (e.g. editing just the title). Mongoose
// silently drops a string assigned to a nested-object field, which was
// wiping out photos on every edit that wasn't also a fresh upload. Wrap
// strings back into the expected shape, and drop empty values entirely so
// an existing photo is left untouched instead of being cleared.
function normalizePicturePayload(payload) {
  for (const key of ['image', 'photo']) {
    if (!(key in payload)) continue;
    const value = payload[key];
    if (!value || (typeof value === 'string' && !value.trim())) delete payload[key];
    else if (typeof value === 'string') payload[key] = { imageUrl: value };
  }
  return payload;
}
export async function publicList(req, res) { const Model = resources[req.params.resource]; if (!Model) return fail(res, 'Unknown content resource', 404); const filter = req.params.resource === 'news' ? { published: true, active: true } : { active: true }; return ok(res, (await Model.find(filter).sort('-createdAt')).map(frontendShape)); }
export async function publicDetail(req, res) { const Model = resources[req.params.resource]; if (!Model) return fail(res, 'Unknown content resource', 404); const filter = req.params.resource === 'news' ? { published: true, active: true } : { active: true }; const item = await Model.findOne({ slug: req.params.slug, ...filter }); return item ? ok(res, frontendShape(item)) : fail(res, 'Content not found', 404); }
export async function adminList(req, res) { const Model = resources[req.params.resource]; if (!Model) return fail(res, 'Unknown content resource', 404); const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const [data, total] = await Promise.all([Model.find().sort('-createdAt').skip((page - 1) * limit).limit(limit), Model.countDocuments()]); return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) }); }
export async function adminCreate(req, res) { const Model = resources[req.params.resource]; if (!Model) return fail(res, 'Unknown content resource', 404); const payload = normalizePicturePayload({ ...req.body }); if (['programs', 'departments', 'news'].includes(req.params.resource) && !payload.slug) payload.slug = slugify(payload.title || payload.name); if (req.params.resource === 'news') { payload.author = req.user._id; payload.published = true; payload.publishedAt = payload.date || new Date(); } const item = await Model.create(payload); await recordAudit(req, { action: `${req.params.resource} created`, module: 'Website', resourceId: item._id, description: `Created ${payload.title || payload.name || 'gallery item'}` }); return ok(res, item, 'Content created', 201); }
export async function adminUpdate(req, res) { const Model = resources[req.params.resource]; if (!Model) return fail(res, 'Unknown content resource', 404); const payload = normalizePicturePayload({ ...req.body }); const item = await Model.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }); if (!item) return fail(res, 'Content not found', 404); await recordAudit(req, { action: `${req.params.resource} updated`, module: 'Website', resourceId: item._id, description: `Updated ${payload.title || payload.name || item.title || item.name || 'gallery item'}` }); return ok(res, item, 'Content updated'); }
export async function adminDelete(req, res) { const Model = resources[req.params.resource]; if (!Model) return fail(res, 'Unknown content resource', 404); const item = await Model.findByIdAndUpdate(req.params.id, { active: false }, { new: true }); if (!item) return fail(res, 'Content not found', 404); await recordAudit(req, { action: `${req.params.resource} deleted`, module: 'Website', resourceId: item._id, description: `Deleted ${item.title || item.name || 'gallery item'}`, status: 'warning' }); return ok(res, item, 'Content archived'); }
export async function publishNews(req, res) { const item = await News.findByIdAndUpdate(req.params.id, { published: req.body.published !== false, publishedAt: new Date() }, { new: true }); return item ? ok(res, item, item.published ? 'News published' : 'News unpublished') : fail(res, 'News not found', 404); }
export async function getSettings(_req, res) { return ok(res, await WebsiteSetting.findOne({ key: 'default' }) || {}); }
export async function updateSettings(req, res) { const settings = await WebsiteSetting.findOneAndUpdate({ key: 'default' }, { ...req.body, key: 'default' }, { new: true, upsert: true, runValidators: true }); await recordAudit(req, { action: 'Website settings changed', module: 'Website', resourceId: settings._id, description: 'Updated website settings' }); return ok(res, settings, 'Settings updated'); }
export async function getHero(_req, res) { const settings = await WebsiteSetting.findOne({ key: 'default' }); return ok(res, settings?.hero || {}); }
export async function updateHero(req, res) { const settings = await WebsiteSetting.findOneAndUpdate({ key: 'default' }, { $set: { hero: req.body } }, { new: true, upsert: true }); await recordAudit(req, { action: 'Homepage hero changed', module: 'Website', resourceId: settings._id, description: 'Updated homepage hero content' }); return ok(res, settings.hero, 'Hero updated'); }
