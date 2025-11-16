const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const toBase64 = (input) => {
  if (typeof btoa === 'function') {
    return btoa(input);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'binary').toString('base64');
  }
  throw new Error('Base64 encoding is not supported in this environment.');
};

const fromBase64 = (input) => {
  if (typeof atob === 'function') {
    return atob(input);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'base64').toString('binary');
  }
  throw new Error('Base64 decoding is not supported in this environment.');
};

const base64UrlEncode = (buffer) =>
  toBase64(String.fromCharCode(...(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))))
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const textEncoder = new TextEncoder();

const pemToArrayBuffer = (pem) => {
  const normalised = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = fromBase64(normalised);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

const importPrivateKey = async (pem) =>
  crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(pem),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );

const signJwt = async (privateKeyPem, payload) => {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(textEncoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const key = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, textEncoder.encode(unsignedToken));
  const encodedSignature = base64UrlEncode(signature);
  return `${unsignedToken}.${encodedSignature}`;
};

const fetchAccessToken = async (assertion) => {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Google access token: ${response.status} ${errorText}`);
  }

  return response.json();
};

const normaliseScope = (scopes) => {
  if (!scopes) {
    return 'https://www.googleapis.com/auth/spreadsheets';
  }
  if (Array.isArray(scopes)) {
    return scopes.join(' ');
  }
  return scopes;
};

class GoogleAuth {
  constructor(options = {}) {
    const credentials = options.credentials || {};
    this.clientEmail = credentials.client_email || '';
    this.privateKey = credentials.private_key || '';
    this.scope = normaliseScope(options.scopes);
    this.cachedToken = null;
    this.cachedExpiry = 0;
  }

  async getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedToken && this.cachedExpiry - 60 > now) {
      return this.cachedToken;
    }

    if (!this.clientEmail || !this.privateKey) {
      throw new Error('Missing Google service account credentials.');
    }

    const payload = {
      iss: this.clientEmail,
      scope: this.scope,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    };

    const assertion = await signJwt(this.privateKey, payload);
    const tokenResponse = await fetchAccessToken(assertion);
    this.cachedToken = tokenResponse.access_token;
    this.cachedExpiry = now + (tokenResponse.expires_in || 3600);
    return this.cachedToken;
  }

  async getRequestHeaders() {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }
}

const createSheetsClient = ({ auth } = {}) => {
  if (!auth) {
    throw new Error('Google Sheets client requires an auth instance.');
  }

  return {
    spreadsheets: {
      values: {
        get: async ({ spreadsheetId, range }) => {
          if (!spreadsheetId) {
            throw new Error('spreadsheetId is required');
          }
          if (!range) {
            throw new Error('range is required');
          }

          const headers = await auth.getRequestHeaders();
          const url = new URL(
            `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
          );
          const response = await fetch(url, { headers });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Sheets API error (${response.status}): ${errorText}`);
          }

          const data = await response.json();
          return { data };
        },
      },
    },
  };
};

export const google = {
  auth: {
    GoogleAuth,
  },
  sheets: ({ auth } = {}) => createSheetsClient({ auth }),
};

export default { google };
