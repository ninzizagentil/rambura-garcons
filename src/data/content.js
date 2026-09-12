export const PROGRAMS = [
  {
    slug: 'electrical-technology',
    title: 'Electrical Technology',
    level: 'Level 3–5',
    duration: '3 years',
    summary: 'Domestic and industrial wiring, installation, and maintenance of electrical systems.',
    details:
      'Students learn circuit theory, safe wiring practice, motor control, and industrial installation, finishing with a supervised workshop placement.',
    seedImage: 'programs/electrical-technology.svg',
  },
  {
    slug: 'welding-fabrication',
    title: 'Welding & Fabrication',
    level: 'Level 3–5',
    duration: '3 years',
    summary: 'Metal joining techniques, structural fabrication, and workshop safety.',
    details:
      'Covers arc and gas welding, metal cutting, structural assembly, and quality inspection, with strong emphasis on workshop safety practice.',
    seedImage: 'programs/welding-fabrication.svg',
  },
  {
    slug: 'construction',
    title: 'Construction',
    level: 'Level 3–5',
    duration: '3 years',
    summary: 'Masonry, concrete work, and building technology fundamentals.',
    details:
      'Trains students in site setup, masonry, concrete work, reading building plans, and modern construction techniques used across Rwanda.',
    seedImage: 'programs/construction.svg',
  },
  {
    slug: 'automobile-mechanics',
    title: 'Automobile Mechanics',
    level: 'Level 3–5',
    duration: '3 years',
    summary: 'Engine systems, diagnostics, and vehicle maintenance.',
    details:
      'Focuses on engine systems, electrical diagnostics, transmission repair, and preventive maintenance across common vehicle makes.',
    seedImage: 'programs/automobile-mechanics.svg',
  },
];

export const DEPARTMENTS = [
  { slug: 'electrical', name: 'Electrical Technology Department', head: 'Eng. Callixte Bizimana', staffCount: 6, seedImage: 'departments/electrical.svg' },
  { slug: 'welding', name: 'Welding & Fabrication Department', head: 'Mr. Vincent Habyarimana', staffCount: 5, seedImage: 'departments/welding.svg' },
  { slug: 'construction', name: 'Construction Department', head: 'Eng. Solange Mukashyaka', staffCount: 5, seedImage: 'departments/construction.svg' },
  { slug: 'automobile', name: 'Automobile Mechanics Department', head: 'Mr. Fabrice Nsengiyumva', staffCount: 4, seedImage: 'departments/automobile.svg' },
];

export const STAFF = [
  { id: 's1', name: 'Bro. Alphonse Ntawuruhunga', role: 'School Director', department: 'Management', bio: 'Over 15 years leading TVET institutions across Western Province.', seedImage: 'staff/s1.svg' },
  { id: 's2', name: 'Eng. Callixte Bizimana', role: 'Head of Electrical Department', department: 'Electrical Technology', bio: 'Licensed electrical engineer with industry and teaching experience.', seedImage: 'staff/s2.svg' },
  { id: 's3', name: 'Mr. Vincent Habyarimana', role: 'Head of Welding Department', department: 'Welding & Fabrication', bio: 'Certified welding instructor and workshop safety examiner.', seedImage: 'staff/s3.svg' },
  { id: 's4', name: 'Eng. Solange Mukashyaka', role: 'Head of Construction Department', department: 'Construction', bio: 'Civil engineer specialising in building technology instruction.', seedImage: 'staff/s4.svg' },
  { id: 's5', name: 'Mr. Fabrice Nsengiyumva', role: 'Head of Automobile Department', department: 'Automobile Mechanics', bio: 'Automotive technician trainer with dealership diagnostics background.', seedImage: 'staff/s5.svg' },
  { id: 's6', name: 'Marie Claire Uwase', role: 'School Librarian', department: 'Library', bio: 'Manages the school library and reading programs for all trades.', seedImage: 'staff/s6.svg' },
];

export const NEWS = [
  {
    slug: 'district-skills-competition-2026',
    title: 'Rambura Garçons Wins District Skills Competition',
    category: 'Achievement',
    date: '2026-08-04',
    excerpt: 'Our welding and electrical teams took top honours at the Nyabihu District Skills Competition.',
    content:
      'Students from the welding and electrical technology departments represented Rambura Garçons at this year\'s Nyabihu District Skills Competition, taking first place in both categories. The competition tested speed, precision, and safety compliance across live workshop tasks. Preparation began three months earlier under close supervision from department heads, and the results reflect the school\'s continued investment in hands-on trade instruction.',
    seedImage: 'news/district-skills-competition-2026.svg',
  },
  {
    slug: 'new-welding-workshop-2026',
    title: 'New Welding Workshop Officially Opened',
    category: 'Facilities',
    date: '2026-07-21',
    excerpt: 'A newly equipped welding workshop was inaugurated, doubling practical training capacity.',
    content:
      'The school officially opened its expanded welding workshop this month, adding modern equipment and doubling the number of students who can train at once. The facility was funded through a partnership between the school and local industry sponsors, and reflects a broader push to strengthen practical training capacity across all four trade departments.',
    seedImage: 'news/new-welding-workshop-2026.svg',
  },
  {
    slug: 'admissions-2026-open',
    title: '2026 Admissions Window Now Open',
    category: 'Admissions',
    date: '2026-07-10',
    excerpt: 'Applications for the next intake are open across all four trade programs.',
    content:
      'Rambura Garçons has opened its admissions window for the coming intake. Prospective students can apply across Electrical Technology, Welding & Fabrication, Construction, and Automobile Mechanics. Full requirements, important dates, and the application process are available on the Admissions page.',
    seedImage: 'news/admissions-2026-open.svg',
  },
];

export const GALLERY = [
  { id: 'g1', category: 'Workshops', caption: 'Electrical workshop practical session', seedImage: 'gallery/g1.svg' },
  { id: 'g2', category: 'Workshops', caption: 'Welding & fabrication bay', seedImage: 'gallery/g2.svg' },
  { id: 'g3', category: 'Workshops', caption: 'Construction site training', seedImage: 'gallery/g3.svg' },
  { id: 'g4', category: 'Workshops', caption: 'Automobile mechanics workshop', seedImage: 'gallery/g4.svg' },
  { id: 'g5', category: 'Events', caption: 'Annual skills competition', seedImage: 'gallery/g5.svg' },
  { id: 'g6', category: 'Campus Life', caption: 'Library reading hall', seedImage: 'gallery/g6.svg' },
  { id: 'g7', category: 'Events', caption: 'Graduation ceremony', seedImage: 'gallery/g7.svg' },
  { id: 'g8', category: 'Campus Life', caption: 'Campus front view', seedImage: 'gallery/g8.svg' },
  { id: 'g9', category: 'Student Life', caption: 'Students learning together', seedImage: 'gallery/g6.svg' },
  { id: 'g10', category: 'Sports', caption: 'Students at a school competition', seedImage: 'gallery/g5.svg' },
  { id: 'g11', category: 'Facilities', caption: 'Rambura Garçons campus facilities', seedImage: 'gallery/g8.svg' },
  { id: 'g12', category: 'Community', caption: 'School and community activities', seedImage: 'gallery/g8.svg' },
  { id: 'g13', category: 'Ceremonies', caption: 'Celebrating student achievement', seedImage: 'gallery/g7.svg' },
];

export const TESTIMONIALS = [
  { quote: 'The workshop training gave me confidence to solve real electrical problems from my first day on placement.', name: 'Aline Mukamana', detail: 'Electrical Technology graduate' },
  { quote: 'Rambura Garçons helped me turn an interest in welding into a practical career and a small fabrication business.', name: 'Jean Claude Habimana', detail: 'Welding & Fabrication graduate' },
  { quote: 'The teachers know every learner and push us to build skills we can use beyond the classroom.', name: 'Diane Uwimana', detail: 'Construction student' },
];

export const ACHIEVEMENTS = [
  { value: '1st', label: 'Nyabihu District Skills Competition', year: '2026' },
  { value: '4', label: 'Industry-focused trade programmes', year: 'Active today' },
  { value: '20+', label: 'Years serving practical education', year: 'Since 2005' },
];
