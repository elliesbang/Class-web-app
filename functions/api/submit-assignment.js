import { jsonResponse, errorResponse } from '../utils/jsonResponse.js';
import { appendRecord, getHeaderRow } from '../utils/sheets.js';

const ASSIGNMENT_RANGE = 'Assignments!A1:Z2000';
const ASSIGNMENT_HEADER_RANGE = 'Assignments!A1:1';

const normalisePayload = (payload = {}) => {
  const record = { ...payload };
  if (!record.id) {
    record.id = crypto.randomUUID();
  }
  if (!record.createdAt) {
    record.createdAt = new Date().toISOString();
  }
  if (!record.submittedAt) {
    record.submittedAt = record.createdAt;
  }
  return record;
};

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return errorResponse('Invalid payload for assignment submission', 400);
    }
    const headers = await getHeaderRow(context.env, ASSIGNMENT_HEADER_RANGE);
    if (!headers || headers.length === 0) {
      throw new Error('Assignments sheet header row is empty.');
    }
    const record = normalisePayload(body);
    await appendRecord(context.env, ASSIGNMENT_RANGE, record, headers);
    return jsonResponse({ success: true, data: record });
  } catch (error) {
    console.error('[submit-assignment] failed', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to submit assignment');
  }
}
