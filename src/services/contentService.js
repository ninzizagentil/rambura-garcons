import { useEffect, useState } from 'react';
import { ACHIEVEMENTS, TESTIMONIALS } from '../data/content';
import { api } from './api';
import { uploadImage } from './imageService';

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
  studentVoices: {
    eyebrow: 'Student voices',
    title: 'Built for confidence beyond the classroom',
  },
  testimonials: TESTIMONIALS,
  progress: {
    eyebrow: 'Achievements',
    title: 'Progress you can measure',
  },
  achievements: ACHIEVEMENTS,
  homeContent: {
    heroButtons: { primary: 'Discover More', secondary: 'Learn About Us' },
    highlights: [
      { title: 'Practical', subtitle: 'Training' },
      { title: 'Skilled', subtitle: 'Instructors' },
      { title: 'Modern', subtitle: 'Facilities' },
      { title: 'Career', subtitle: 'Focused' },
    ],
    aboutPreview: {
      eyebrow: 'About Us',
      title: 'Empowering Youth Through',
      titleAccent: 'Quality Technical Education',
      description: 'We are committed to providing industry-relevant training, modern facilities and a supportive learning environment that prepares students for successful careers and lifelong impact.',
      imageLabel: 'Hands-on learning',
      imageTitle: 'Industry-ready practical training',
    },
    programs: { eyebrow: 'Our Programs', title: 'Programs We Offer', button: 'View All Programs', cardAction: 'Learn More' },
    admissionsCta: {
      eyebrow: 'Admissions open',
      title: 'Ready to Start Your Journey?',
      description: 'Join Rambura Garçons TVET School and build the skills for a better future.',
      button: 'Apply Now',
    },
  },
};

const DEFAULT_ABOUT = {
  heroTitle: 'About Rambura Garçons',
  heroIntro: 'A technical and vocational education and training school formed to serve Nyabihu District and beyond.',
  historyTitle: 'School History',
  history: "Rambura Garçons was founded to answer a clear need in Nyabihu District: skilled tradespeople trained to a professional standard, close to home. Since opening, the school has grown from a single workshop to four full trade departments, graduating classes of electricians, welders, builders, and mechanics who now work across Rwanda's growing construction and industrial sectors.",
  missionTitle: 'Mission',
  mission: 'To equip young Rwandans with practical trade skills, professional discipline, and the confidence to build sustainable livelihoods.',
  visionTitle: 'Vision',
  vision: 'To be the leading TVET institution in Western Province, known for graduates who set the standard in their trades.',
  valuesTitle: 'Core Values',
  values: ['Discipline', 'Craftsmanship', 'Integrity', 'Service to Community'],
  leadershipTitle: 'Leadership',
  leadershipIntro: 'Meet the people guiding Rambura Garçons.',
  facilitiesTitle: 'Facilities',
  facilities: [
    { key: 'electrical', label: 'Electrical wiring workshop' },
    { key: 'welding', label: 'Welding & fabrication bay' },
    { key: 'construction', label: 'Construction training yard' },
    { key: 'automobile', label: 'Automobile mechanics garage' },
    { key: 'library', label: 'School library and reading hall' },
    { key: 'dormitories', label: 'Boarding dormitories' },
  ],
};

const DEFAULT_STAFF_PAGE = {
  title: 'Our Staff',
  intro: 'The instructors and leaders behind Rambura Garçons.',
};

const DEFAULT_ACADEMICS_PAGE = {
  title: 'Academics',
  intro: 'Four trade programs, each built for real workplace readiness.',
};

const DEFAULT_DEPARTMENTS_PAGE = {
  title: 'Departments',
  intro: 'Four departments, each led by an experienced trade professional.',
};

const DEFAULT_ADMISSIONS = {
  title: 'Admissions',
  intro: 'Start your journey toward practical skills and a meaningful career.',
  informationTitle: 'Admission Information',
  informationIntro: 'Everything you need to know before applying',
  requirementsTitle: 'Requirements',
  requirementsIntro: 'What you need to qualify for admission',
  requirementsCardTitle: 'Admission Requirements',
  datesTitle: 'Important Dates',
  datesIntro: 'Key dates for the admission cycle',
  datesCardTitle: 'Important Dates',
  processTitle: 'Admission Process',
  processIntro: 'How our admission process works',
  processCardTitle: 'Step-by-Step Process',
  supportTitle: 'Contact & Support',
  supportIntro: "Questions? We're here to help",
  supportCardTitle: 'Get in Touch',
  applicationTitle: 'Admission Application',
  applicationIntro: 'Complete the form below to apply for any of our programs.',
  requirements: [], dates: [], process: '', contactLine: '',
};

const DEFAULT_NEWS_PAGE = {
  title: 'News',
  intro: 'Updates from around the Rambura Garçons campus.',
};

const DEFAULT_GALLERY_PAGE = {
  title: 'Gallery',
  intro: 'Life at Rambura Garçons, in and out of the workshop.',
};

const DEFAULT_CONTACT_PAGE = {
  title: 'Contact Us',
  intro: "We'd love to hear from you.",
  informationTitle: 'Get in Touch',
  informationIntro: "We're here to answer any questions you may have",
  developerName: 'Ninziza Aime Gentil, Byiringiro Dady Roger, Niyonsaba Emery',
  developerUrl: '/developers',
};

const DEFAULT_DEVELOPERS_PAGE = {
  title: 'Website Developers',
  intro: 'The people behind the digital experience, content tools, and management system built for Rambura Garçons.',
  teamLabel: 'The team',
  heading: 'Built with purpose.',
  description: "This system brings the school's public story and day-to-day operations into one dependable digital home.",
  developers: [
    { name: 'Ninziza Aime Gentil', role: 'Product & Interface Development', bio: 'Shapes clear, accessible experiences for students, families, and staff.', skills: ['UI design', 'Frontend', 'Accessibility'], photo: '', socials: { facebook: '', instagram: '', whatsapp: '', twitter: '', github: '' } },
    { name: 'Byiringiro Dady Roger', role: 'Platform & Systems Development', bio: 'Builds dependable systems that support the school team every day.', skills: ['Backend', 'APIs', 'Infrastructure'], photo: '', socials: { facebook: '', instagram: '', whatsapp: '', twitter: '', github: '' } },
    { name: 'Niyonsaba Emery', role: 'Data & Experience Development', bio: 'Connects information and workflows so the school can work with confidence.', skills: ['Data', 'Workflows', 'User experience'], photo: '', socials: { facebook: '', instagram: '', whatsapp: '', twitter: '', github: '' } },
  ],
  capabilities: [
    { label: 'Public website', detail: 'A clear digital front door for students, families, and partners.' },
    { label: 'Content management', detail: 'Tools that keep school information current without code changes.' },
    { label: 'Management system', detail: 'Connected workflows for the people running the school every day.' },
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
  value.category = value.category || 'General';
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

export function useContentVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('rg:content-updated', bump);
    return () => window.removeEventListener('rg:content-updated', bump);
  }, []);
  return version;
}

export function getHero() {
  return {
    ...DEFAULT_HERO,
    ...cache.hero,
    stats: cache.hero?.stats || DEFAULT_HERO.stats,
    studentVoices: { ...DEFAULT_HERO.studentVoices, ...(cache.hero?.studentVoices || {}) },
    testimonials: cache.hero?.testimonials || DEFAULT_HERO.testimonials,
    progress: { ...DEFAULT_HERO.progress, ...(cache.hero?.progress || {}) },
    achievements: cache.hero?.achievements || DEFAULT_HERO.achievements,
    homeContent: {
      ...DEFAULT_HERO.homeContent,
      ...(cache.hero?.homeContent || {}),
      heroButtons: { ...DEFAULT_HERO.homeContent.heroButtons, ...(cache.hero?.homeContent?.heroButtons || {}) },
      aboutPreview: { ...DEFAULT_HERO.homeContent.aboutPreview, ...(cache.hero?.homeContent?.aboutPreview || {}) },
      programs: { ...DEFAULT_HERO.homeContent.programs, ...(cache.hero?.homeContent?.programs || {}) },
      admissionsCta: { ...DEFAULT_HERO.homeContent.admissionsCta, ...(cache.hero?.homeContent?.admissionsCta || {}) },
      highlights: cache.hero?.homeContent?.highlights || DEFAULT_HERO.homeContent.highlights,
    },
  };
}
export function getAbout() {
  return { ...DEFAULT_ABOUT, ...cache.settings.about, values: cache.settings.about?.values || DEFAULT_ABOUT.values, facilities: cache.settings.about?.facilities || DEFAULT_ABOUT.facilities };
}
export function getStaffPage() { return { ...DEFAULT_STAFF_PAGE, ...(cache.settings.staffPage || {}) }; }
export function getAcademicsPage() { return { ...DEFAULT_ACADEMICS_PAGE, ...(cache.settings.academicsPage || {}) }; }
export function getDepartmentsPage() { return { ...DEFAULT_DEPARTMENTS_PAGE, ...(cache.settings.departmentsPage || {}) }; }
export function getNewsPage() { return { ...DEFAULT_NEWS_PAGE, ...(cache.settings.newsPage || {}) }; }
export function getGalleryPage() { return { ...DEFAULT_GALLERY_PAGE, ...(cache.settings.galleryPage || {}) }; }
export function getContactPage() {
  const saved = cache.settings.contactPage || {};
  return {
    ...DEFAULT_CONTACT_PAGE,
    ...saved,
    developerName: !saved.developerName || saved.developerName === 'Website Developer' || saved.developerName === 'Rambura Garçons Development Team'
      ? DEFAULT_CONTACT_PAGE.developerName
      : saved.developerName,
    developerUrl: saved.developerUrl || DEFAULT_CONTACT_PAGE.developerUrl,
  };
}
function normalizeDeveloper(developer) {
  const photo = developer?.photo;
  return {
    ...developer,
    photo: typeof photo === 'string' ? photo : photo?.imageUrl || '',
    socials: {
      facebook: '',
      instagram: '',
      whatsapp: '',
      twitter: '',
      github: '',
      ...(developer?.socials || {}),
    },
  };
}
export function getDevelopersPage() {
  const saved = cache.settings.developersPage || {};
  return {
    ...DEFAULT_DEVELOPERS_PAGE,
    ...saved,
    developers: (saved.developers || DEFAULT_DEVELOPERS_PAGE.developers).map(normalizeDeveloper),
    capabilities: saved.capabilities || DEFAULT_DEVELOPERS_PAGE.capabilities,
  };
}
export function getPrograms() { return cache.programs; }
export function getDepartments() { return cache.departments; }
export function getStaff() { return cache.staff; }
export function getNews() { return cache.news; }
export function getGallery() { return cache.gallery; }
export function getAdmissionsInfo() { return { ...DEFAULT_ADMISSIONS, ...(cache.settings.admissions || cache.settings.homepageSettings || {}) }; }
export function getAdmissionsSettings() { return getAdmissionsInfo(); }
export function getContactInfo() { return cache.settings.contact || cache.settings.contactSettings || { address: '', phone: '', email: '', mapQuery: '' }; }
export function getContactSettings() { return getContactInfo(); }
export function getTestimonials() { return cache.hero?.testimonials || TESTIMONIALS; }
export function getAchievements() { return cache.hero?.achievements || ACHIEVEMENTS; }

async function mutate(method, path, data) {
  try {
    const payload = { ...data };
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
export function updateAboutInfo(data) { return mutate('put', '/admin/settings', { about: data }); }
export function updateStaffPage(data) { return mutate('put', '/admin/settings', { staffPage: data }); }
export function updateAcademicsPage(data) { return mutate('put', '/admin/settings', { academicsPage: data }); }
export function updateDepartmentsPage(data) { return mutate('put', '/admin/settings', { departmentsPage: data }); }
export function updateNewsPage(data) { return mutate('put', '/admin/settings', { newsPage: data }); }
export function updateGalleryPage(data) { return mutate('put', '/admin/settings', { galleryPage: data }); }
export function updateContactPage(data) { return mutate('put', '/admin/settings', { contactPage: data }); }
export async function updateDevelopersPage(data) {
  try {
    const developers = await Promise.all((data.developers || []).map(async (developer) => ({
      ...developer,
      photo: typeof developer.photo === 'string' && developer.photo.startsWith('data:')
        ? (await uploadImage(developer.photo, 'rambura-garcons/developers')).imageUrl
        : typeof developer.photo === 'string' ? developer.photo : developer.photo?.imageUrl || '',
    })));
    return mutate('put', '/admin/settings', { developersPage: { ...data, developers } });
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export async function submitContactMessage(data) {
  const result = await api.post('/public/contact', data);
  return result.data;
}
export function updatePage(_pageId, data) { return updateHero(data); }
