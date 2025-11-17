export async function onRequest({ env }) {
  const db = env.DB;

  const query = `
    SELECT 
      c.id,
      c.name,
      c.description,
      c.order_num,
      c.thumbnail_url,
      c.created_at,
      c.updated_at,
      c.category_id,
      cat.name AS category_name
    FROM classroom c
    LEFT JOIN class_category cat
      ON c.category_id = cat.id
    ORDER BY c.order_num ASC, c.id ASC
  `;

  const result = await db.prepare(query).all();
  return Response.json(result);
}
