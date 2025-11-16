import { google } from 'googleapis';

const resolveEnv = (key, runtimeEnv) => {
  if (runtimeEnv && typeof runtimeEnv === 'object' && runtimeEnv[key]) {
    return runtimeEnv[key];
  }

  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  return undefined;
};

export async function getSheet(sheetName, runtimeEnv) {
  if (!sheetName) {
    throw new Error('sheetName is required');
  }

  const clientEmail = resolveEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL', runtimeEnv);
  const privateKeyRaw = resolveEnv('GOOGLE_PRIVATE_KEY', runtimeEnv);
  const spreadsheetId = resolveEnv('GOOGLE_SHEET_ID', runtimeEnv);

  if (!clientEmail || !privateKeyRaw || !spreadsheetId) {
    throw new Error('Missing Google Sheets environment variables.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKeyRaw.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z999`,
  });

  const rows = response?.data?.values;
  if (!rows || rows.length < 2) {
    return [];
  }

  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] || '';
    });
    return record;
  });
}
