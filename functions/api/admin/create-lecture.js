import { jsonResponse, errorResponse } from '../../utils/jsonResponse.js';
import { appendRecord, getHeaderRow } from '../../utils/sheets.js';
import { isAdminRequest } from './_auth.js';

const CONTENT_RANGE = 'Content!A1:Z1000';
const CONTENT_HEADER_RANGE = 'Content!A1:1';

const normaliseLectureRecord = (record = {}) => {
  const payload = { ...record };
  payload.type = 'lecture';
  if (!payload.id) {
    payload.id = crypto.randomUUID();
  }
  const timestamp = new Date().toISOString();
  payload.createdAt = payload.createdAt || timestamp;
  payload.updatedAt = timestamp;
  return payload;
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
    const headers = await getHeaderRow(context.env, CONTENT_HEADER_RANGE);
    if (!headers || headers.length === 0) {
      throw new Error('Content sheet header row is empty.');
    }
    const record = normaliseLectureRecord(payload.record || payload);
    await appendRecord(context.env, CONTENT_RANGE, record, headers);
    return jsonResponse({ success: true, data: record });
  } catch (error) {
    console.error('[admin/create-lecture] failed', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to create lecture');
  }
}
