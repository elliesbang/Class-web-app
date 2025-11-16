import { jsonResponse, errorResponse } from '../../utils/jsonResponse.js';
import { fetchValues, rowsToObjects, findRowNumberById, deleteRow } from '../../utils/sheets.js';
import { isAdminRequest } from './_auth.js';

const CONTENT_RANGE = 'Content!A1:Z1000';
const SHEET_TITLE = 'Content';

const loadRecords = async (env) => {
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
      return errorResponse('Content id is required', 400);
    }
    const records = await loadRecords(context.env);
    const rowNumber = findRowNumberById(records, id);
    if (rowNumber === -1) {
      return errorResponse('Content not found', 404);
    }
    await deleteRow(context.env, SHEET_TITLE, rowNumber);
    return jsonResponse({ success: true, id });
  } catch (error) {
    console.error('[admin/delete-content] failed', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to delete content');
  }
}
