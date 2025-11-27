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

export const onRequest = async ({
  request,
  env,
}: {
  request: Request;
  env: Record<string, string | undefined>;
}) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = getSupabaseClient(env);
    const body = await request.json();

    const token =
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
      undefined;

    // -----------------------------
    // ✔ 프론트에서 보내는 정확한 payload 이름
    // -----------------------------
    let {
      class_id,
      student_id,
      session_no,
      image_base64,
      link_url,
    } = body as {
      class_id?: string | number;
      student_id?: string;
      session_no?: string | number;
      image_base64?: string | null;
      link_url?: string | null;
    };

    // -----------------------------
    // ✔ 필드 기본 검증
    // -----------------------------
    if (!class_id || !session_no) {
      return jsonResponse({ error: 'class_id and session_no are required' }, 400);
    }

    // text 컬럼 통일
    class_id = String(class_id);
    session_no = String(session_no);

    // -----------------------------
    // ✔ 학생 ID 결정 (profiles 기반)
    // -----------------------------
    const userResult = token ? await supabase.auth.getUser(token) : null;

    // auth.users.id 대신 profiles.id를 쓰기 위해 body 값을 우선 사용
    const resolvedStudentId = student_id ?? null;

    if (!resolvedStudentId) {
      return jsonResponse(
        { error: 'Missing student_id (profiles.id required)' },
        400
      );
    }

    // -----------------------------
    // ✔ 이미지 업로드
    // -----------------------------
    let uploadedImageUrl: string | null = null;

    if (image_base64) {
      const match = image_base64.match(/^data:(.+);base64,(.*)$/);
      const base64Data = match?.[2] ?? image_base64.split(',').pop();
      const mimeType = match?.[1] ?? 'image/png';

      if (!base64Data) {
        return jsonResponse({ error: 'Invalid image payload' }, 400);
      }

      const buffer = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0)
      );
      const extension = mimeType.split('/')[1] || 'png';

      const filePath = `assignments/${class_id}/${resolvedStudentId}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, buffer, { contentType: mimeType });

      if (uploadError) {
        return jsonResponse(
          { error: 'Upload failed', details: uploadError.message },
          500
        );
      }

      uploadedImageUrl = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath).data.publicUrl;
    }

    // 링크 클린
    const cleanedLink = link_url?.trim() || null;

    // -----------------------------
    // ✔ INSERT (class_id 기준)
    // -----------------------------
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        class_id,
        student_id: resolvedStudentId,
        session_no,
        image_url: uploadedImageUrl,
        link_url: cleanedLink,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return jsonResponse(
        { error: 'Insert failed', details: error.message },
        500
      );
    }

    return jsonResponse({ assignment: data }, 200);
  } catch (err) {
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      500
    );
  }
};