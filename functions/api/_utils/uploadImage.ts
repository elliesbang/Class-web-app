const toArrayBuffer = (base64String: string) => {
  const cleaned = base64String.includes(',') ? base64String.split(',')[1] : base64String;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const resolveBucket = (env: Record<string, any>): R2Bucket => {
  const bucket =
    env.ASSIGNMENT_BUCKET || env.R2_BUCKET || env.R2 || env.BUCKET || env.bucket || env.storageBucket;

  if (!bucket || typeof bucket.put !== 'function') {
    throw new Error('R2 bucket is not configured');
  }

  return bucket as R2Bucket;
};

const resolvePublicBaseUrl = (env: Record<string, any>): string | null => {
  const base = env.PUBLIC_R2_URL || env.R2_PUBLIC_URL || env.PUBLIC_BUCKET_URL || env.R2_PUBLIC_BASE;
  if (typeof base === 'string' && base.trim().length > 0) {
    return base.trim().replace(/\/$/, '');
  }
  return null;
};

export const uploadImage = async (env: Record<string, any>, base64String: string): Promise<string> => {
  if (!base64String) {
    throw new Error('base64String is required');
  }

  const bucket = resolveBucket(env);
  const key = `assignments/${crypto.randomUUID()}`;
  const contentTypeMatch = base64String.match(/^data:(.*?);base64,/);
  const contentType = contentTypeMatch?.[1] || 'application/octet-stream';
  const data = toArrayBuffer(base64String);

  await bucket.put(key, data, {
    httpMetadata: { contentType },
  });

  const publicBase = resolvePublicBaseUrl(env);
  if (publicBase) {
    return `${publicBase}/${key}`;
  }

  return key;
};
