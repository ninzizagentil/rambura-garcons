/**
 * socialIcons — the platform glyphs plus each platform's real brand color,
 * shared between the public navbar's top info bar and the site footer so
 * both stay in sync from a single source (edit a URL or color once, here).
 */
import { FacebookGlyph, TwitterGlyph, InstagramGlyph, YoutubeGlyph } from './socialGlyphs';

// Each platform's own real brand color. Instagram doesn't have a single
// brand color — it uses an official four/five-stop gradient — so it gets
// `background` (a full CSS value) instead of a flat `color`.
export const SOCIALS = [
  { Icon: FacebookGlyph, label: 'Facebook', href: 'https://www.facebook.com/ramburagarcons', background: '#1877F2' },
  { Icon: TwitterGlyph, label: 'Twitter', href: 'https://x.com/ramburagarcons', background: '#1DA1F2' },
  {
    Icon: InstagramGlyph,
    label: 'Instagram',
    href: 'https://www.instagram.com/ramburagarcons',
    background: 'linear-gradient(45deg, #4f5bd5, #962fbf, #d62976, #fa7e1e, #feda75)',
  },
  { Icon: YoutubeGlyph, label: 'YouTube', href: 'https://www.youtube.com/@ramburagarcons', background: '#FF0000' },
];
