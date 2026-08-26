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
export async function publicList(req, res) { const Model = resources[req.params.resource]; if (!Model) return fail(res, 'Unknown content resource', 404); const filter = { active: true }; if (req.params.resource === 'news') filter.published = true; return ok(res, (await Model.find(filter).sort('-createdAt')).map(frontendShape)); }
export async function publicDetail(req, res) { const Model = resources[req.params.resource]; if (!Model) return fail(res, 'Unknown content resource', 404); const item = await Model.findOne({ slug: req.params.slug, active: true, ...(req.params.resource === 'news' ? { published: true } : {}) }); return item ? ok(res, frontendShape(item)) : fail(res, 'Content not found', 404); }
export async function adminList(req, res) { const Model = resources[req.params.resource]; const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const [data, total] = await Promise.all([Model.find().sort('-createdAt').skip((page - 1) * limit).limit(limit), Model.countDocuments()]); return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) }); }
export async function adminCreate(req, res) { const Model = resources[req.params.resource]; const payload = { ...req.body }; if (['programs', 'departments', 'news'].includes(req.params.resource) && !payload.slug) payload.slug = slugify(payload.title || payload.name); if (req.params.resource === 'news') payload.author = req.user._id; const item = await Model.create(payload); await recordAudit(req, { action: `${req.params.resource} created`, module: 'Website', resourceId: item._id, description: `Created ${payload.title || payload.name || 'gallery item'}` }); return ok(res, item, 'Content created', 201); }
export async function adminUpdate(req, res) { const Model = resources[req.params.resource]; const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); return item ? ok(res, item, 'Content updated') : fail(res, 'Content not found', 404); }
export async function adminDelete(req, res) { const Model = resources[req.params.resource]; const item = await Model.findByIdAndUpdate(req.params.id, { active: false }, { new: true }); return item ? ok(res, item, 'Content archived') : fail(res, 'Content not found', 404); }
export async function publishNews(req, res) { const item = await News.findByIdAndUpdate(req.params.id, { published: req.body.published !== false, publishedAt: new Date() }, { new: true }); return item ? ok(res, item, item.published ? 'News published' : 'News unpublished') : fail(res, 'News not found', 404); }
export async function getSettings(_req, res) { return ok(res, await WebsiteSetting.findOne({ key: 'default' }) || {}); }
export async function updateSettings(req, res) { const settings = await WebsiteSetting.findOneAndUpdate({ key: 'default' }, { ...req.body, key: 'default' }, { new: true, upsert: true, runValidators: true }); await recordAudit(req, { action: 'Website settings changed', module: 'Website', resourceId: settings._id, description: 'Updated website settings' }); return ok(res, settings, 'Settings updated'); }
export async function getHero(_req, res) { const settings = await WebsiteSetting.findOne({ key: 'default' }); return ok(res, settings?.hero || {}); }
export async function updateHero(req, res) { const settings = await WebsiteSetting.findOneAndUpdate({ key: 'default' }, { $set: { hero: req.body } }, { new: true, upsert: true }); return ok(res, settings.hero, 'Hero updated'); }
