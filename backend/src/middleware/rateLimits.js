import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message, errors: [] },
});

// Public "track my application" lookups: stops people guessing reference numbers / contacts.
export const trackingLimiter = make(15 * 60 * 1000, 30, 'Too many lookups. Please wait a few minutes and try again.');

// Public forms (admission application, contact message): stops spam floods.
export const publicFormLimiter = make(60 * 60 * 1000, 30, 'Too many submissions from this network. Please try again later.');
