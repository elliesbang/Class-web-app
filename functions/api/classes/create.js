import DB from '../_db';

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

export async function onRequestPost(context) {
  const db = new DB(context.env.DB);
  const body = await context.request.json();

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

  try {
    const result = await db.run(
      `INSERT INTO classes (title, category_id, type, upload_limit, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [title, categoryId, type, uploadLimit]
    );

    const insertedId = result?.meta?.last_row_id;
    const record = insertedId
      ? await db.first('SELECT * FROM classes WHERE id = ?', [insertedId])
      : null;

    return new Response(
      JSON.stringify({ success: true, data: record ? [record] : [] }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 201,
      }
    );
  } catch (err) {
    console.error('수업 저장 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
