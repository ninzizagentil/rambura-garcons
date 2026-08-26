/**
 * socialIcons — the platform glyphs plus each platform's real brand color,
 * shared between the public navbar's top info bar and the site footer so
 * both stay in sync from a single source (edit a URL or color once, here).
 */
function FacebookGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.87.24-1.46 1.49-1.46H16.5V4.36C16.24 4.32 15.36 4.25 14.33 4.25c-2.15 0-3.63 1.31-3.63 3.72V10.5H8.2v3h2.5V21h2.8z" />
    </svg>
  );
}
function TwitterGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.9 7.06c.01.18.01.36.01.54 0 5.48-4.17 11.8-11.8 11.8-2.35 0-4.53-.69-6.36-1.87.33.04.65.05.99.05a8.32 8.32 0 0 0 5.15-1.77 4.16 4.16 0 0 1-3.88-2.88c.26.04.51.07.79.07.38 0 .75-.05 1.1-.14a4.15 4.15 0 0 1-3.33-4.08v-.05c.56.31 1.21.5 1.89.52a4.15 4.15 0 0 1-1.85-3.46c0-.77.2-1.48.56-2.09a11.8 11.8 0 0 0 8.56 4.34 4.15 4.15 0 0 1 7.07-3.79 8.3 8.3 0 0 0 2.64-1 4.16 4.16 0 0 1-1.83 2.3 8.28 8.28 0 0 0 2.38-.65 8.6 8.6 0 0 1-2.09 2.16z" />
    </svg>
  );
}
function InstagramGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
function YoutubeGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.5a2.9 2.9 0 0 0-2.05-2.06C17.8 5 12 5 12 5s-5.8 0-7.55.44A2.9 2.9 0 0 0 2.4 7.5 30.6 30.6 0 0 0 2 12a30.6 30.6 0 0 0 .4 4.5 2.9 2.9 0 0 0 2.05 2.06C6.2 19 12 19 12 19s5.8 0 7.55-.44a2.9 2.9 0 0 0 2.05-2.06A30.6 30.6 0 0 0 22 12a30.6 30.6 0 0 0-.4-4.5zM10 15V9l5.2 3-5.2 3z" />
    </svg>
  );
}

// Each platform's own real brand color. Instagram doesn't have a single
// brand color — it uses an official four/five-stop gradient — so it gets
// `background` (a full CSS value) instead of a flat `color`.
export const SOCIALS = [
  { Icon: FacebookGlyph, label: 'Facebook', href: '#', background: '#1877F2' },
  { Icon: TwitterGlyph, label: 'Twitter', href: '#', background: '#1DA1F2' },
  {
    Icon: InstagramGlyph,
    label: 'Instagram',
    href: '#',
    background: 'linear-gradient(45deg, #4f5bd5, #962fbf, #d62976, #fa7e1e, #feda75)',
  },
  { Icon: YoutubeGlyph, label: 'YouTube', href: '#', background: '#FF0000' },
];
