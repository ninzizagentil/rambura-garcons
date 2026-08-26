import { useEffect, useState } from 'react';
import { getBranding, BRANDING_EVENT } from '../services/brandingService';

/**
 * Gives any component the current logo, and re-renders it the moment an
 * admin saves a new one — no prop drilling, no page refresh needed.
 *
 * @returns {{ logoUrl: string }}
 */
export function useSiteBranding() {
  const [branding, setBranding] = useState(getBranding());

  useEffect(() => {
    const refresh = () => setBranding(getBranding());
    window.addEventListener(BRANDING_EVENT, refresh);
    window.addEventListener('storage', refresh); // keeps other open tabs in sync too
    return () => {
      window.removeEventListener(BRANDING_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return branding;
}
