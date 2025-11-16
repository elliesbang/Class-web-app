import { jsonResponse, errorResponse } from '../../utils/jsonResponse.js';
import { fetchValues, rowsToObjects, findRowNumberById, deleteRow } from '../../utils/sheets.js';
import { isAdminRequest } from './_auth.js';

const CONTENT_RANGE = 'Content!A1:Z1000';
const SHEET_TITLE = 'Content';

const loadLectureRecords = async (env) => {
  const values = await fetchValues(env, CONTENT_RANGE);
  return rowsToObjects(values);
};

export async function onRequestDelete(context) {
  try {
    if (!isAdminRequest(context.request, context.env)) {
      return errorResponse('Unauthorized', 401);
    }
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return errorResponse('Lecture id is required', 400);
    }
    const records = await loadLectureRecords(context.env);
    const target = records.find((record) => String(record.id).trim() === id.trim() && record.type === 'lecture');
    if (!target) {
      return errorResponse('Lecture not found', 404);
    }
    const rowNumber = findRowNumberById(records, target.id);
    if (rowNumber === -1) {
      return errorResponse('Unable to locate lecture row', 404);
    }
    await deleteRow(context.env, SHEET_TITLE, rowNumber);
    return jsonResponse({ success: true, id });
  } catch (error) {
    console.error('[admin/delete-lecture] failed', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to delete lecture');
  }
}
