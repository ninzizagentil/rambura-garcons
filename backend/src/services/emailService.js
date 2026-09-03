import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Initialize transporter (uses SMTP - configure in .env)
let transporter = null;

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
    .map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.minLevel}</td><td>${item.location}</td></tr>`)
    .join('');

  const html = `
    <h2>Low Stock Alert - Rambura Garcons</h2>
    <p>Hi ${userName},</p>
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
      subject: `Low Stock Alert - ${items.length} item(s) below minimum level`,
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
    <p>Hi ${approverName},</p>
    <p>A disposal request requires your approval:</p>
    <ul>
      <li><strong>Item:</strong> ${itemName}</li>
      <li><strong>Quantity:</strong> ${quantity}</li>
      <li><strong>Reason:</strong> ${reason}</li>
    </ul>
    <p>Please review and approve/reject this request in the Stock Management System.</p>
    <p>Best regards,<br>Rambura Garcons Stock Management System</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@rambura-garcons.com',
      to: approverEmail,
      subject: `Disposal Approval Required: ${itemName}`,
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
    .map((item) => `<tr><td>${item.name}</td><td>${item.batchNumber || 'N/A'}</td><td>${new Date(item.expiryDate).toLocaleDateString()}</td></tr>`)
    .join('');

  const html = `
    <h2>Expiry Date Notification - Rambura Garcons</h2>
    <p>Hi ${userName},</p>
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
      subject: `Expiry Notification - ${items.length} item(s) expiring soon`,
      html
    });

    console.log('[EMAIL] Expiry Notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending expiry notification:', error);
    return { success: false, error: error.message };
  }
}
