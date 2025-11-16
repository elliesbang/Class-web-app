import { jsonResponse, errorResponse } from '../../utils/jsonResponse.js';
import {
  fetchValues,
  rowsToObjects,
  findRowNumberById,
  getHeaderRow,
  updateRecord,
} from '../../utils/sheets.js';
import { isAdminRequest } from './_auth.js';

const CONTENT_RANGE = 'Content!A1:Z1000';
const CONTENT_HEADER_RANGE = 'Content!A1:1';

const loadContentRecords = async (env) => {
  const values = await fetchValues(env, CONTENT_RANGE);
  return rowsToObjects(values);
};

export async function onRequestPut(context) {
  try {
    if (!isAdminRequest(context.request, context.env)) {
      return errorResponse('Unauthorized', 401);
    }
    const payload = await context.request.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return errorResponse('Invalid payload', 400);
    }
    const { id, updates = {} } = payload;
    if (!id) {
      return errorResponse('Content id is required', 400);
    }
    const records = await loadContentRecords(context.env);
    const rowNumber = findRowNumberById(records, id);
    if (rowNumber === -1) {
      return errorResponse('Content not found', 404);
    }
    const headers = await getHeaderRow(context.env, CONTENT_HEADER_RANGE);
    const existingRecord = records[rowNumber - 2] || {};
    const timestamp = new Date().toISOString();
    const record = { ...existingRecord, ...updates, updatedAt: timestamp };
    await updateRecord(context.env, `Content!A${rowNumber}:Z${rowNumber}`, record, headers);
    return jsonResponse({ success: true, data: record });
  } catch (error) {
    console.error('[admin/update-content] failed', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to update content');
  }
}
