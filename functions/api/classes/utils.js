export const ensureDb = async (env) => {
  if (!env.DB) throw new Error('D1 Database binding not found');
  return env.DB;
};

export const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const handleError = (err) => {
  console.error('DB Error:', err);
  return new Response(
    JSON.stringify({ success: false, error: err.message }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
};
