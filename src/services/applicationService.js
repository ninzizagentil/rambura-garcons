import { api } from './api';

export async function getApplications(params = {}) {
  const result = await api.get('/applications', params);
  return result.data;
}

/**
 * @param {{ fullName: string, email: string, phone: string, program: string, programLabel: string, message?: string }} data
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

/** @param {'new'|'reviewed'|'accepted'|'declined'} status */
export async function updateApplicationStatus(id, status) {
  try {
    const result = await api.patch(`/applications/${id}/status`, { status });
    return { success: true, application: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
