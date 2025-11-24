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

export const onRequest = async ({ request, env }: { request: Request; env: Record<string, string | undefined> }) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = getSupabaseClient(env);
    const body = await request.json();

    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? undefined;

    let {
      classroom_id,
      student_id,
      session_no,
      image_base64,
      link_url
    } = body as {
      classroom_id?: string | number;
      student_id?: string;
      session_no?: string | number;
      image_base64?: string | null;
      link_url?: string | null;
    };

    // 강제 문자열 변환 (DB가 text이므로)
    classroom_id = String(classroom_id);
    session_no = String(session_no);

    if (!classroom_id || !session_no) {
      return jsonResponse({ error: 'classroom_id and session_no are required' }, 400);
    }

    if (!image_base64 && !link_url) {
      return jsonResponse({ error: 'No submission provided' }, 400);
    }

    // student_id 결정
    const userResult = token ? await supabase.auth.getUser(token) : null;
    const resolvedStudentId = userResult?.data.user?.id ?? student_id;

    if (!resolvedStudentId) {
      return jsonResponse({ error: 'Missing student identifier' }, 400);
    }

    // 이미지 업로드 처리
    let uploadedImageUrl: string | null = null;

    if (image_base64) {
      const base64Match = image_base64.match(/^data:(.+);base64,(.*)$/);
      const base64Data = base64Match?.[2] ?? image_base64.split(',').pop();
      const mimeType = base64Match?.[1] ?? 'image/png';

      if (!base64Data) {
        return jsonResponse({ error: 'Invalid image payload' }, 400);
      }

      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const extension = mimeType.split('/')[1] || 'png';

      const filePath = `assignments/${classroom_id}/${resolvedStudentId}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, buffer, { contentType: mimeType });

      if (uploadError) {
        return jsonResponse({ error: 'Upload failed', details: uploadError.message }, 500);
      }

      uploadedImageUrl =
        supabase.storage.from('assignments').getPublicUrl(filePath).data.publicUrl;
    }

    const cleanedLink = link_url?.trim() || null;

    // INSERT (status 제거, 모든 값 text 맞춤)
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        classroom_id,
        student_id: resolvedStudentId,
        session_no,
        image_url: uploadedImageUrl,
        link_url: cleanedLink,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: 'Insert failed', details: error.message }, 500);
    }

    return jsonResponse({ assignment: data }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
};
