/**
 * CENTRAL IMAGE CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────
 * Every photo used across the public website is defined ONCE, right here.
 * To change any picture on the site, just replace the URL string below —
 * you never need to touch a page component.
 *
 * You can point any entry at:
 *   1. A URL to any image already hosted online (Unsplash, your own CDN,
 *      Google Drive "share" link converted to direct link, etc.)
 *   2. A local file placed in /src/assets and imported at the top of a page.
 *
 * By default this file uses https://picsum.photos — a free service that
 * serves real, royalty-free photographs. Each image has a unique "seed" in
 * the URL, so the same seed always returns the same photo, but changing the
 * seed (or swapping in any other image URL) instantly changes the picture
 * everywhere it's used, with no other code changes required.
 *
 * Format reference: https://picsum.photos/seed/<any-text>/<width>/<height>
 */

const photo = (seed, w = 900, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const IMAGES = {
  // ---- Home page ---------------------------------------------------------
  home: {
    hero: photo('rambura-hero-campus', 1200, 900),
    gallery: [
      photo('rambura-preview-1', 500, 500),
      photo('rambura-preview-2', 500, 500),
      photo('rambura-preview-3', 500, 500),
      photo('rambura-preview-4', 500, 500),
    ],
  },

  // ---- About page ---------------------------------------------------------
  about: {
    campus: photo('rambura-about-campus', 1000, 700),
    leadership: photo('rambura-about-leadership', 700, 700),
    facilities: {
      electrical: photo('rambura-facility-electrical', 500, 350),
      welding: photo('rambura-facility-welding', 500, 350),
      construction: photo('rambura-facility-construction', 500, 350),
      automobile: photo('rambura-facility-automobile', 500, 350),
      library: photo('rambura-facility-library', 500, 350),
      dormitories: photo('rambura-facility-dormitories', 500, 350),
    },
  },

  // ---- Academics: keyed by program slug -----------------------------------
  programs: {
    'electrical-technology': photo('rambura-program-electrical', 600, 400),
    'welding-fabrication': photo('rambura-program-welding', 600, 400),
    construction: photo('rambura-program-construction', 600, 400),
    'automobile-mechanics': photo('rambura-program-automobile', 600, 400),
  },

  // ---- Departments: keyed by department slug ------------------------------
  departments: {
    electrical: photo('rambura-dept-electrical', 600, 360),
    welding: photo('rambura-dept-welding', 600, 360),
    construction: photo('rambura-dept-construction', 600, 360),
    automobile: photo('rambura-dept-automobile', 600, 360),
  },

  // ---- Staff: keyed by staff id --------------------------------------------
  staff: {
    s1: photo('rambura-staff-s1', 300, 300),
    s2: photo('rambura-staff-s2', 300, 300),
    s3: photo('rambura-staff-s3', 300, 300),
    s4: photo('rambura-staff-s4', 300, 300),
    s5: photo('rambura-staff-s5', 300, 300),
    s6: photo('rambura-staff-s6', 300, 300),
  },

  // ---- News: keyed by news slug ---------------------------------------------
  news: {
    'district-skills-competition-2026': photo('rambura-news-skills-2026', 800, 450),
    'new-welding-workshop-2026': photo('rambura-news-workshop-2026', 800, 450),
    'admissions-2026-open': photo('rambura-news-admissions-2026', 800, 450),
  },

  // ---- Gallery: keyed by gallery item id -----------------------------------
  gallery: {
    g1: photo('rambura-gallery-g1', 700, 700),
    g2: photo('rambura-gallery-g2', 700, 700),
    g3: photo('rambura-gallery-g3', 700, 700),
    g4: photo('rambura-gallery-g4', 700, 700),
    g5: photo('rambura-gallery-g5', 700, 700),
    g6: photo('rambura-gallery-g6', 700, 700),
    g7: photo('rambura-gallery-g7', 700, 700),
    g8: photo('rambura-gallery-g8', 700, 700),
  },

  // ---- Admissions page ------------------------------------------------------
  admissions: {
    hero: photo('rambura-admissions-hero', 900, 400),
  },
};

/** Safe lookup with an automatic fallback photo if a key is ever missing. */
export function getImage(map, key, fallbackSeed = 'rambura-fallback', w = 600, h = 400) {
  return (map && map[key]) || photo(fallbackSeed, w, h);
}

export default IMAGES;
