import { api } from './api';

const API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');

/** One application with its photo/documents (the list endpoint leaves the big files out). */
export async function getApplication(id) {
  const result = await api.get(`/applications/${id}`);
  return { ...result.data, id: String(result.data.id || result.data._id) };
}

export async function getApplications(params = {}) {
  const first = await api.get('/applications', { ...params, page: 1, limit: 100 });
  const pages = first.pagination?.totalPages || 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      api.get('/applications', { ...params, page: index + 2, limit: 100 })
    )
  );
  return [first.data || [], ...rest.map((result) => result.data || [])]
    .flat()
    .map((application) => ({ ...application, id: String(application.id || application._id) }));
}

/**
 * @param {{ fullName: string, email: string, phone: string, program: string, programLabel: string,
 *   dateOfBirth: string, gender: string, educationLevel: string, district: string,
 *   previousSchool?: string, guardianName: string, guardianPhone: string,
 *   guardianRelationship: string, intakeYear: string, privacyConsent: boolean, message?: string }} data
 */
export async function submitApplication(data) {
  const result = await api.post('/public/applications', {
    ...data,
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    message: data.message?.trim() || '',
  });
  return result.data;
}

/**
 * Public track: look up an application by reference number AND the email or phone used to apply.
 * Returns safe public-facing fields only.
 * @param {string} query
 * @returns {Promise<{ referenceNumber: string, fullName: string, programLabel: string,
 *   status: string, submittedAt: string, reviewedAt: string|null,
 *   reviewFeedback: string|null, hasAdminAttachment: boolean,
 *   adminAttachmentName: string|null, intakeYear: string }>}
 */
export async function trackApplication(reference, contact) {
  const result = await api.get('/public/track-application', { ref: reference.trim(), contact: contact.trim() });
  return result.data;
}

/**
 * Returns the URL for downloading the admin-uploaded attachment for a given reference number.
 * @param {string} referenceNumber
 */
export function getAdminAttachmentUrl(referenceNumber, token) {
  return `${API_URL}/public/track-attachment/${encodeURIComponent(referenceNumber)}?token=${encodeURIComponent(token || '')}`;
}

/**
 * @param {string} id
 * @param {'new'|'reviewed'|'accepted'|'declined'} status
 * @param {{ reviewFeedback?: string, adminAttachment?: string|null, adminAttachmentName?: string }} [extras]
 */
export async function updateApplicationStatus(id, status, extras = {}) {
  try {
    const body = { status };
    if (typeof extras.reviewFeedback === 'string') body.reviewFeedback = extras.reviewFeedback;
    if ('adminAttachment' in extras) {
      body.adminAttachment = extras.adminAttachment ?? null;
      body.adminAttachmentName = extras.adminAttachmentName ?? null;
    }
    const result = await api.patch(`/applications/${id}/status`, body);
    return { success: true, application: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteApplication(id) {
  try {
    await api.delete(`/applications/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
