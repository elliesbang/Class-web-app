import { jsonResponse, errorResponse } from '../../utils/jsonResponse.js';
import { appendRecord, getHeaderRow } from '../../utils/sheets.js';
import { isAdminRequest } from './_auth.js';

const CONTENT_RANGE = 'Content!A1:Z1000';
const CONTENT_HEADER_RANGE = 'Content!A1:1';

const normaliseRecord = (record = {}) => {
  const normalised = { ...record };
  if (!normalised.id) {
    normalised.id = crypto.randomUUID();
  }
  const timestamp = new Date().toISOString();
  normalised.createdAt = normalised.createdAt || timestamp;
  normalised.updatedAt = timestamp;
  if (normalised.type) {
    normalised.type = String(normalised.type).trim().toLowerCase();
  }
  return normalised;
};

export async function onRequestPost(context) {
  try {
    if (!isAdminRequest(context.request, context.env)) {
      return errorResponse('Unauthorized', 401);
    }
    const payload = await context.request.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return errorResponse('Invalid payload', 400);
    }
    const record = normaliseRecord(payload.record || payload);
    if (!record.type) {
      return errorResponse('Content type is required', 400);
    }
    const headers = await getHeaderRow(context.env, CONTENT_HEADER_RANGE);
    if (!headers || headers.length === 0) {
      throw new Error('Content sheet header row is empty.');
    }
    await appendRecord(context.env, CONTENT_RANGE, record, headers);
    return jsonResponse({ success: true, data: record });
  } catch (error) {
    console.error('[admin/create-content] failed', error);
    if (error instanceof Response) {
      return error;
    }
    return errorResponse(error instanceof Error ? error.message : 'Failed to create content');
  }
}
