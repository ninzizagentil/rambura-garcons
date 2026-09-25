import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Without this, opening a page from the menu keeps the scroll position of the previous page,
// so a short page opens already scrolled down to the footer.
// - New page (menu click / link)  -> start at the top of the page.
// - Link with #section            -> scroll to that section (waits for lazy-loaded pages to render).
// - Browser Back / Forward        -> left to the browser, which restores the old position.
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') return undefined;

    if (!hash) {
      // "instant" because the page CSS uses smooth scrolling, which would animate down from the footer.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return undefined;
    }

    let tries = 0;
    let frame;
    const goToSection = () => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (tries < 30) {
        tries += 1;
        frame = window.setTimeout(goToSection, 100); // the page may still be loading
      }
    };
    goToSection();
    return () => window.clearTimeout(frame);
  }, [pathname, search, hash, navigationType]);

  return null;
}
