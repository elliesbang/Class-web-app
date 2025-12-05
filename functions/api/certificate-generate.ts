import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = (env: Record<string, string | undefined>) => {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY;

  return createClient(url!, key!);
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequest({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const userId = searchParams.get('user_id');

    if (!classId || !userId) {
      return jsonResponse({ error: 'class_id and user_id are required' }, 400);
    }

    const supabase = getSupabaseClient(env);

    const certificateContent = `Certificate of Completion\n\nClass: ${classId}\nUser: ${userId}\nIssued: ${new Date().toLocaleString('ko-KR')}`;
    const filePath = `certificates/${classId}/${userId}-${Date.now()}.pdf`;
    const fileBuffer = new TextEncoder().encode(certificateContent);

    const { error: uploadError } = await supabase.storage.from('certificates').upload(filePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (uploadError) {
      return jsonResponse({ error: 'Failed to generate certificate', details: uploadError.message }, 500);
    }

    const publicUrl = supabase.storage.from('certificates').getPublicUrl(filePath).data.publicUrl;

    return jsonResponse({ url: publicUrl });
  } catch (err) {
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      500,
    );
  }
}
