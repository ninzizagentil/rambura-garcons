import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Initialize transporter (uses SMTP - configure in .env)
let transporter = null;

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
  if (!transporter) initEmailService();
  const recipient = process.env.CONTACT_EMAIL || process.env.SMTP_FROM || 'info@rambura-garcons.rw';
  const html = `<h2>Website contact message</h2><p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>`;
  if (!process.env.SMTP_HOST) {
    console.log('[EMAIL] Contact message (SMTP not configured):', { recipient, name, email, subject, message });
    return { success: false, reason: 'SMTP not configured' };
  }
  try {
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || email, replyTo: email, to: recipient, subject: `[Website] ${cleanHeader(subject)}`, html });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Contact message failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSystemAlertEmail(userEmail, userName, title, message, link) {
  if (!transporter) initEmailService();
  const html = `<h2>${escapeHtml(title)}</h2><p>Hi ${escapeHtml(userName || 'there')},</p><p>${escapeHtml(message)}</p>${link ? `<p><a href="${escapeHtml(link)}">Open the school management system</a></p>` : ''}`;
  if (!process.env.SMTP_HOST) {
    console.log('[EMAIL] System alert (SMTP not configured):', { userEmail, title, message });
    return { success: false, reason: 'SMTP not configured' };
  }
  try {
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || 'noreply@rambura-garcons.com', to: userEmail, subject: cleanHeader(title), html });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] System alert failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(userEmail, userName, resetUrl) {
  if (!transporter) initEmailService();
  const html = `<h2>Reset your Rambura Garçons password</h2><p>Hi ${escapeHtml(userName || 'there')},</p><p>Use the secure link below to reset your password. It expires soon and can only be used once.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`;
  if (!process.env.SMTP_HOST) {
    console.log('[EMAIL] Password reset link (SMTP not configured):', resetUrl);
    return { success: false, reason: 'SMTP not configured', resetUrl };
  }
  try {
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || 'noreply@rambura-garcons.com', to: userEmail, subject: 'Reset your Rambura Garçons password', html });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Password reset failed:', error);
    return { success: false, error: error.message };
  }
}

export function initEmailService() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      : undefined
  });

  return transporter;
}

/**
 * Send low-stock alert email
 */
export async function sendLowStockAlert(userEmail, userName, items) {
  if (!transporter) initEmailService();
  if (!process.env.SMTP_HOST) {
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
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@rambura-garcons.com',
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
  if (!transporter) initEmailService();
  if (!process.env.SMTP_HOST) {
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
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@rambura-garcons.com',
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
  if (!transporter) initEmailService();
  if (!process.env.SMTP_HOST) {
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
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@rambura-garcons.com',
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
