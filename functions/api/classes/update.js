import DB from '../utils/db';

const toTrimmedString = (value, fallback = '') => {
  if (value == null) {
    return fallback;
  }
  if (Array.isArray(value)) {
    return value.map((item) => toTrimmedString(item, '')).filter(Boolean).join(',');
  }
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : fallback;
};

const toNullableNumber = (value) => {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function onRequestPut(context) {
  const db = new DB(context.env.DB);
  const body = await context.request.json();

  const id = toNullableNumber(body.id ?? body.class_id ?? body.classId);
  const title = toTrimmedString(
    body.title ?? body.name ?? body.class_name ?? body.className ?? body.code ?? '',
  );
  const categoryId = toNullableNumber(
    body.category_id ?? body.categoryId ?? body.categoryID ?? body.category ?? null,
  );
  const type = toTrimmedString(
    body.type ??
      body.class_type ??
      body.classType ??
      body.assignment_upload_time ??
      body.assignmentUploadTime ??
      body.delivery_methods ??
      body.deliveryMethods ??
      '',
  );
  const uploadLimit = toTrimmedString(
    body.upload_limit ??
      body.uploadLimit ??
      body.assignment_upload_days ??
      body.assignmentUploadDays ??
      body.upload_day ??
      body.uploadDay ??
      '',
    '',
  );

  if (!id) {
    return new Response(JSON.stringify({ success: false, message: '수업 ID가 필요합니다.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  try {
    await db.run(
      `UPDATE classes
          SET title = ?, category_id = ?, type = ?, upload_limit = ?, updated_at = datetime('now')
        WHERE id = ?`,
      [title, categoryId, type, uploadLimit, id]
    );

    const record = await db.first('SELECT * FROM classes WHERE id = ?', [id]);

    return new Response(
      JSON.stringify({ success: true, data: record ? [record] : [] }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('수업 수정 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
