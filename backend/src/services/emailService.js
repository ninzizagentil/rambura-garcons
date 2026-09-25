import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import SystemSetting from '../models/SystemSetting.js';
import { decryptSecret } from '../utils/secretBox.js';

dotenv.config({ quiet: true });

// SMTP settings come from the admin Settings screen (saved in the database) when they are complete,
// otherwise from backend/.env. Read on demand and cached for 30 seconds.
let cachedConfig = null;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function cleanHeader(value = '') {
  return String(value).replace(/[\r\n]/g, ' ').trim();
}

export async function sendContactEmail({ name, email, subject, message }) {
  const mail = await loadMailConfig();
  const recipient = process.env.CONTACT_EMAIL || process.env.SMTP_FROM || 'info@rambura-garcons.rw';
  const html = `<h2>Website contact message</h2><p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>`;
  if (!mail.configured) {
    console.log('[EMAIL] Contact message (SMTP not configured):', { recipient, name, email, subject, message });
    return { success: false, reason: 'SMTP not configured' };
  }
  try {
    const info = await mail.transporter.sendMail({ from: mail.from || email, replyTo: email, to: recipient, subject: `[Website] ${cleanHeader(subject)}`, html });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Contact message failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSystemAlertEmail(userEmail, userName, title, message, link) {
  const mail = await loadMailConfig();
  const html = `<h2>${escapeHtml(title)}</h2><p>Hi ${escapeHtml(userName || 'there')},</p><p>${escapeHtml(message)}</p>${link ? `<p><a href="${escapeHtml(link)}">Open the school management system</a></p>` : ''}`;
  if (!mail.configured) {
    console.log('[EMAIL] System alert (SMTP not configured):', { userEmail, title, message });
    return { success: false, reason: 'SMTP not configured' };
  }
  try {
    const info = await mail.transporter.sendMail({ from: mail.from || 'noreply@rambura-garcons.com', to: userEmail, subject: cleanHeader(title), html });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] System alert failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAdmissionStatusEmail({ email, fullName, referenceNumber, programLabel, status }) {
  const mail = await loadMailConfig();
  const accepted = status === 'accepted';
  const title = accepted ? 'Admission application accepted' : 'Admission application update';
  const message = accepted
    ? `Congratulations. Your application for ${programLabel || 'Rambura Garçons TVET School'} has been accepted.`
    : `Your application for ${programLabel || 'Rambura Garçons TVET School'} was not accepted at this time.`;
  const html = `<h2>${escapeHtml(title)}</h2><p>Dear ${escapeHtml(fullName)},</p><p>${escapeHtml(message)}</p><p><strong>Reference:</strong> ${escapeHtml(referenceNumber || 'N/A')}</p><p><strong>Status:</strong> ${accepted ? 'Accepted' : 'Declined'}</p><p>Please contact the school for the next steps or further information.</p><p>Regards,<br>Rambura Garçons TVET School</p>`;
  if (!mail.configured) {
    console.log('[EMAIL] Admission status (SMTP not configured):', { email, referenceNumber, status });
    return { success: false, reason: 'SMTP not configured' };
  }
  try {
    const info = await mail.transporter.sendMail({
      from: mail.from || 'noreply@rambura-garcons.com',
      to: email,
      subject: cleanHeader(`${title} - ${referenceNumber || 'Application'}`),
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Admission status failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(userEmail, userName, resetUrl) {
  const mail = await loadMailConfig();
  const html = `<h2>Reset your Rambura Garçons password</h2><p>Hi ${escapeHtml(userName || 'there')},</p><p>Use the secure link below to reset your password. It expires soon and can only be used once.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`;
  if (!mail.configured) {
    // Only in development: a reset link in a production log would let anyone with log access take over the account.
    if (process.env.NODE_ENV !== 'production') console.log('[EMAIL] Password reset link (SMTP not configured):', resetUrl);
    else console.warn('[EMAIL] Password reset requested but SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASSWORD).');
    return { success: false, reason: 'SMTP not configured', resetUrl };
  }
  try {
    const info = await mail.transporter.sendMail({ from: mail.from || 'noreply@rambura-garcons.com', to: userEmail, subject: 'Reset your Rambura Garçons password', html });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Password reset failed:', error);
    return { success: false, error: error.message };
  }
}

async function readDatabaseSettings() {
  try {
    const setting = await SystemSetting.findOne({ key: 'email' }).lean();
    return setting?.value || null;
  } catch {
    return null;
  }
}

/** Call after the admin saves new e-mail settings so the change applies immediately. */
export function invalidateMailConfig() {
  cachedConfig = null;
}

/**
 * Resolves the SMTP settings to use. "configured" is true only when the login is complete
 * (host + user + password), or the host is a local test server (MailHog/Mailpit) that needs none.
 * Timeouts are short so an unreachable mail server can never freeze a request for minutes.
 */
export async function loadMailConfig() {
  if (cachedConfig && Date.now() - cachedConfig.at < 30 * 1000) return cachedConfig.config;
  const db = await readDatabaseSettings();
  const useDatabase = Boolean(db?.host && db?.user && db?.password);
  const source = useDatabase
    ? { host: db.host, port: Number(db.port || 587), secure: Boolean(db.secure), user: db.user, pass: decryptSecret(db.password), from: db.from }
    : { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD, from: process.env.SMTP_FROM };
  const isLocalServer = /^(localhost|127\.0\.0\.1|mailhog|mailpit)$/i.test(source.host || '');
  const configured = Boolean(source.host && ((source.user && source.pass) || isLocalServer || process.env.SMTP_ALLOW_NO_AUTH === 'true'));
  const transporter = configured
    ? nodemailer.createTransport({
        host: source.host,
        port: source.port,
        secure: source.secure, // true for port 465, false for 587
        auth: source.user && source.pass ? { user: source.user, pass: source.pass } : undefined,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      })
    : null;
  const config = { configured, transporter, from: source.from || source.user || '', user: source.user || '' };
  cachedConfig = { at: Date.now(), config };
  return config;
}

// Kept for backwards compatibility with older imports.
export const initEmailService = loadMailConfig;

/**
 * Send low-stock alert email
 */
export async function sendLowStockAlert(userEmail, userName, items) {
  const mail = await loadMailConfig();
  if (!mail.configured) {
    console.log('[EMAIL] Low-Stock Alert (SMTP not configured):', { userEmail, items });
    return { success: false, reason: 'SMTP not configured' };
  }

  const itemsList = items
    .map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(item.minLevel)}</td><td>${escapeHtml(item.location)}</td></tr>`)
    .join('');

  const html = `
    <h2>Low Stock Alert - Rambura Garcons</h2>
    <p>Hi ${escapeHtml(userName)},</p>
    <p>The following items are running low on stock and require immediate attention:</p>
    <table border="1" cellpadding="10" style="border-collapse: collapse;">
      <thead>
        <tr><th>Item Name</th><th>Current Qty</th><th>Min Level</th><th>Location</th></tr>
      </thead>
      <tbody>${itemsList}</tbody>
    </table>
    <p>Please reorder these items at your earliest convenience.</p>
    <p>Best regards,<br>Rambura Garcons Stock Management System</p>
  `;

  try {
    const info = await mail.transporter.sendMail({
      from: mail.from || 'noreply@rambura-garcons.com',
      to: userEmail,
      subject: cleanHeader(`Low Stock Alert - ${items.length} item(s) below minimum level`),
      html
    });

    console.log('[EMAIL] Low-Stock Alert sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending low-stock alert:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send disposal approval request email
 */
export async function sendDisposalApprovalRequest(approverEmail, approverName, itemName, quantity, reason) {
  const mail = await loadMailConfig();
  if (!mail.configured) {
    console.log('[EMAIL] Disposal Approval Request (SMTP not configured):', { approverEmail, itemName, quantity });
    return { success: false, reason: 'SMTP not configured' };
  }

  const html = `
    <h2>Disposal Approval Required - Rambura Garcons</h2>
    <p>Hi ${escapeHtml(approverName)},</p>
    <p>A disposal request requires your approval:</p>
    <ul>
      <li><strong>Item:</strong> ${escapeHtml(itemName)}</li>
      <li><strong>Quantity:</strong> ${escapeHtml(quantity)}</li>
      <li><strong>Reason:</strong> ${escapeHtml(reason)}</li>
    </ul>
    <p>Please review and approve/reject this request in the Stock Management System.</p>
    <p>Best regards,<br>Rambura Garcons Stock Management System</p>
  `;

  try {
    const info = await mail.transporter.sendMail({
      from: mail.from || 'noreply@rambura-garcons.com',
      to: approverEmail,
      subject: cleanHeader(`Disposal Approval Required: ${itemName}`),
      html
    });

    console.log('[EMAIL] Disposal Approval Request sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending disposal approval:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send expiry notification email
 */
export async function sendExpiryNotification(userEmail, userName, items) {
  const mail = await loadMailConfig();
  if (!mail.configured) {
    console.log('[EMAIL] Expiry Notification (SMTP not configured):', { userEmail, items });
    return { success: false, reason: 'SMTP not configured' };
  }

  const itemsList = items
    .map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.batchNumber || 'N/A')}</td><td>${escapeHtml(new Date(item.expiryDate).toLocaleDateString())}</td></tr>`)
    .join('');

  const html = `
    <h2>Expiry Date Notification - Rambura Garcons</h2>
    <p>Hi ${escapeHtml(userName)},</p>
    <p>The following items are expiring soon or have already expired:</p>
    <table border="1" cellpadding="10" style="border-collapse: collapse;">
      <thead>
        <tr><th>Item Name</th><th>Batch Number</th><th>Expiry Date</th></tr>
      </thead>
      <tbody>${itemsList}</tbody>
    </table>
    <p>Please take appropriate action immediately.</p>
    <p>Best regards,<br>Rambura Garcons Stock Management System</p>
  `;

  try {
    const info = await mail.transporter.sendMail({
      from: mail.from || 'noreply@rambura-garcons.com',
      to: userEmail,
      subject: cleanHeader(`Expiry Notification - ${items.length} item(s) expiring soon`),
      html
    });

    console.log('[EMAIL] Expiry Notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending expiry notification:', error);
    return { success: false, error: error.message };
  }
}
