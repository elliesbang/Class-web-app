import { jsonResponse, errorResponse } from '../utils/jsonResponse.js';
import { readSheet } from '../utils/sheets.js';

const ASSIGNMENT_RANGE = 'Assignments!A1:Z2000';

export async function onRequestGet(context) {
  try {
    const data = await readSheet(context.env, ASSIGNMENT_RANGE);
    return jsonResponse({ success: true, data });
  } catch (error) {
    console.error('[assignments] failed to load sheet', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to load assignments');
  }
}
