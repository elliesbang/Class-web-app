export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

export function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({ success: false, message }), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}
