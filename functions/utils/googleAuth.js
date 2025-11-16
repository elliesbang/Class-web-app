const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const base64UrlEncode = (buffer) =>
  btoa(String.fromCharCode(...(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))))
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const textEncoder = new TextEncoder();

const importPrivateKey = async (pem) => {
  const normalised = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = Uint8Array.from(atob(normalised), (char) => char.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    binary.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );
};

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

const parseServiceAccount = (env) => {
  const raw = env?.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT environment variable.');
  }

  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT JSON.');
  }
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

let cachedToken = null;
let cachedExpiry = 0;

export const getAccessToken = async (env) => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedExpiry - 60 > now) {
    return cachedToken;
  }

  const serviceAccount = parseServiceAccount(env);
  const iat = now;
  const exp = now + 3600;
  const payload = {
    iss: serviceAccount.client_email,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat,
    exp,
  };

  const assertion = await signJwt(serviceAccount.private_key, payload);
  const tokenResponse = await fetchAccessToken(assertion);
  cachedToken = tokenResponse.access_token;
  cachedExpiry = now + (tokenResponse.expires_in || 3600);
  return cachedToken;
};
