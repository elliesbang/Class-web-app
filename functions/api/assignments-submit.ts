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
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await request.json();
    const { class_id, student_id, session_no, content_type, image_base64, link_url, text_content } = body as {
      class_id?: number;
      student_id?: string;
      session_no?: number;
      content_type?: 'image' | 'link' | 'text';
      image_base64?: string | null;
      link_url?: string | null;
      text_content?: string | null;
    };

    if (!class_id || !student_id || !session_no || !content_type) {
      return jsonResponse({ error: 'class_id, student_id, session_no and content_type are required' }, 400);
    }

    const supabase = getSupabaseClient(env);

    const { data: existingAssignments, error: existingError } = await supabase
      .from('assignments')
      .select('id')
      .eq('class_id', class_id)
      .eq('student_id', student_id)
      .eq('session_no', session_no)
      .limit(1);

    if (existingError) {
      return jsonResponse({ error: 'Failed to check existing assignments', details: existingError.message }, 500);
    }

    if (existingAssignments && existingAssignments.length > 0) {
      return jsonResponse({ error: '이미 제출된 과제입니다.' }, 409);
    }

    let uploadedImageUrl: string | null = null;

    if (content_type === 'image' && image_base64) {
      const base64Data = image_base64.split(',')[1] ?? image_base64;
      const buffer =
        typeof Buffer !== 'undefined'
          ? Buffer.from(base64Data, 'base64')
          : Uint8Array.from(
              (typeof globalThis.atob === 'function' ? globalThis.atob(base64Data) : '') as string,
              (c) => c.charCodeAt(0),
            );
      const filePath = `assignments/${class_id}/${student_id}/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, buffer, {
          contentType: 'image/png',
        });

      if (uploadError) {
        return jsonResponse({ error: 'Upload failed', details: uploadError.message }, 500);
      }

      uploadedImageUrl = supabase.storage.from('assignments').getPublicUrl(filePath).data.publicUrl;
    }

    const insertPayload: Record<string, unknown> = {
      class_id,
      classroom_id: class_id,
      student_id,
      session_no: Number(session_no),
      type: content_type,
      link_url: content_type === 'link' ? link_url ?? null : null,
      text_content: content_type === 'text' ? text_content ?? null : null,
      image_url: content_type === 'image' ? uploadedImageUrl : null,
      status: 'success',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('assignments').insert(insertPayload).select().single();

    if (error) {
      return jsonResponse({ error: 'Insert failed', details: error.message }, 500);
    }

    return jsonResponse({ assignment: data });
  } catch (err) {
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      500,
    );
  }
}
