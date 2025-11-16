import { jsonResponse, errorResponse } from '../utils/jsonResponse.js';
import { readSheet } from '../utils/sheets.js';

const CONTENT_RANGE = 'Content!A1:Z1000';

export async function onRequestGet(context) {
  try {
    const data = await readSheet(context.env, CONTENT_RANGE);
    return jsonResponse({ success: true, data });
  } catch (error) {
    console.error('[content] failed to load sheet', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to load content data');
  }
}
