// utils/googleSheet.js
export async function getSheetValues(env, range) {
  const sheetId = env.GOOGLE_SHEET_ID;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GOOGLE_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch sheet values');
  return res.json();
}

export async function appendSheetValues(env, range, values) {
  const sheetId = env.GOOGLE_SHEET_ID;

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GOOGLE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) throw new Error('Failed to append sheet values');
  return res.json();
}
