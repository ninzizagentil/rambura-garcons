/** WhatsApp's real brand glyph, drawn at a fixed viewBox so it stays crisp
 * at any button size — matches the pattern used for the footer's social
 * icons (see components/common/socialIcons.jsx). */
function WhatsAppGlyph(props) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" {...props}>
      <path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.36.66 4.56 1.8 6.44L4 29l7.72-1.76a12.02 12.02 0 0 0 4.3.8h.01c6.62 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3zm0 21.94h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-4.58 1.05 1.08-4.46-.24-.37a9.9 9.9 0 0 1-1.52-5.55c0-5.48 4.46-9.94 9.95-9.94 2.66 0 5.15 1.04 7.03 2.92a9.87 9.87 0 0 1 2.91 7.03c0 5.48-4.46 9.91-9.94 9.91h.01zm5.44-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.73-1.63-2.03-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5-.17 0-.37-.02-.57-.02-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}

/** Fixed floating action button in the bottom-right corner of the public
 * site. Opens WhatsApp (app on mobile, web.whatsapp.com on desktop) with
 * the school's WhatsApp number pre-filled, and a friendly starter message
 * so visitors don't stare at a blank chat. */
const WHATSAPP_NUMBER = '250796377311';

export default function WhatsAppButton() {
  const message = encodeURIComponent("Hello Rambura Garçons, I'd like to ask about...");
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="whatsapp-fab group fixed bottom-5 right-5 z-50 flex items-center sm:bottom-6 sm:right-6"
    >
      <span
        className="whatsapp-fab__label pointer-events-none max-w-0 overflow-hidden whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-0 py-2 text-sm font-semibold text-[var(--text-primary)] opacity-0 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out group-hover:mr-3 group-hover:max-w-[220px] group-hover:px-4 group-hover:opacity-100"
      >
        Chat with us on WhatsApp
      </span>

      <span className="whatsapp-fab__icon relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
        <span className="whatsapp-fab__ring absolute inset-0 rounded-full bg-[#25D366]/30" aria-hidden="true" />
        <span className="whatsapp-fab__button relative flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(145deg,#2BE477,#1DB954)] text-white shadow-[0_14px_30px_rgba(37,211,102,0.38)] transition-transform duration-300 ease-out group-hover:scale-105 group-focus-visible:scale-105">
          <WhatsAppGlyph className="h-7 w-7 drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]" />
        </span>
      </span>
    </a>
  );
}
