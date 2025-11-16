import { getAccessToken } from './googleAuth.js';

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const getSheetId = (env) => {
  const sheetId = env?.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID environment variable.');
  }
  return sheetId;
};

const normaliseHeader = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

const buildHeaderCacheKey = (env, range) => `${getSheetId(env)}::${range}`;

const headerCache = new Map();

const withAuthHeaders = async (env, init = {}) => {
  const token = await getAccessToken(env);
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(init.headers || {}),
  };
  return { ...init, headers };
};

export const fetchValues = async (env, range, params = '') => {
  const sheetId = getSheetId(env);
  const url = new URL(`${SHEETS_BASE_URL}/${sheetId}/values/${encodeURIComponent(range)}`);
  if (params) {
    url.search = params;
  }
  const init = await withAuthHeaders(env);
  const response = await fetch(url, init);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error (${response.status}): ${errorText}`);
  }
  const payload = await response.json();
  return payload.values || [];
};

export const rowsToObjects = (values) => {
  if (!values || values.length === 0) {
    return [];
  }
  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map(normaliseHeader);
  return dataRows.map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (!header) {
        return;
      }
      record[header] = row[index] ?? '';
    });
    return record;
  });
};

export const readSheet = async (env, range) => {
  const values = await fetchValues(env, range);
  return rowsToObjects(values);
};

const buildRowFromRecord = (record, headers) => headers.map((header) => record[header] ?? '');

const ensureArray = (value) => (Array.isArray(value) ? value : []);

export const appendRecord = async (env, range, record, headers) => {
  const sheetId = getSheetId(env);
  const url = new URL(
    `${SHEETS_BASE_URL}/${sheetId}/values/${encodeURIComponent(range)}:append`,
  );
  url.searchParams.set('valueInputOption', 'USER_ENTERED');
  url.searchParams.set('insertDataOption', 'INSERT_ROWS');

  const body = JSON.stringify({ values: [buildRowFromRecord(record, headers)] });
  const init = await withAuthHeaders(env, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const response = await fetch(url, init);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to append row: ${response.status} ${errorText}`);
  }
  return response.json();
};

export const updateRecord = async (env, range, record, headers) => {
  const sheetId = getSheetId(env);
  const url = new URL(`${SHEETS_BASE_URL}/${sheetId}/values/${encodeURIComponent(range)}`);
  url.searchParams.set('valueInputOption', 'USER_ENTERED');

  const body = JSON.stringify({ values: [buildRowFromRecord(record, headers)] });
  const init = await withAuthHeaders(env, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const response = await fetch(url, init);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update row: ${response.status} ${errorText}`);
  }
  return response.json();
};

export const clearRow = async (env, range) => {
  const sheetId = getSheetId(env);
  const url = `${SHEETS_BASE_URL}/${sheetId}/values/${encodeURIComponent(range)}:clear`;
  const init = await withAuthHeaders(env, { method: 'POST' });
  const response = await fetch(url, init);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to clear row: ${response.status} ${errorText}`);
  }
  return response.json();
};

export const fetchSheetMetadata = async (env) => {
  const sheetId = getSheetId(env);
  const url = `${SHEETS_BASE_URL}/${sheetId}?fields=sheets.properties`;
  const init = await withAuthHeaders(env);
  const response = await fetch(url, init);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch sheet metadata: ${response.status} ${errorText}`);
  }
  return response.json();
};

export const deleteRow = async (env, sheetTitle, rowNumber) => {
  const metadata = await fetchSheetMetadata(env);
  const sheet = ensureArray(metadata.sheets).find(
    (item) => item?.properties?.title === sheetTitle,
  );
  if (!sheet) {
    throw new Error(`Sheet titled "${sheetTitle}" not found.`);
  }
  const sheetId = sheet.properties.sheetId;
  const startIndex = Math.max(0, rowNumber - 1);
  const requests = [
    {
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex,
          endIndex: startIndex + 1,
        },
      },
    },
  ];
  const body = JSON.stringify({ requests });
  const sheetIdValue = getSheetId(env);
  const url = `${SHEETS_BASE_URL}/${sheetIdValue}:batchUpdate`;
  const init = await withAuthHeaders(env, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const response = await fetch(url, init);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete row: ${response.status} ${errorText}`);
  }
  return response.json();
};

export const findRowNumberById = (records, targetValue, keyName = 'id') => {
  if (!Array.isArray(records)) {
    return -1;
  }
  const targetKey = keyName.toLowerCase();
  for (let index = 0; index < records.length; index += 1) {
    const value = records[index]?.[keyName] ?? records[index]?.[targetKey];
    if (value != null && String(value).trim() === String(targetValue).trim()) {
      return index + 2; // account for header row
    }
  }
  return -1;
};

export const getHeaderRow = async (env, range, options = {}) => {
  const { refresh = false } = options;
  const cacheKey = buildHeaderCacheKey(env, range);
  if (!refresh && headerCache.has(cacheKey)) {
    return headerCache.get(cacheKey);
  }
  const values = await fetchValues(env, range);
  const headers = values[0]?.map(normaliseHeader) ?? [];
  headerCache.set(cacheKey, headers);
  return headers;
};

export const clearHeaderCache = (env, range) => {
  const cacheKey = buildHeaderCacheKey(env, range);
  headerCache.delete(cacheKey);
};

export const ensureArrayRecord = (record) =>
  Object.keys(record || {}).length > 0 ? record : {};
