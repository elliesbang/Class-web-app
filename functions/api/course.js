import { initNotion, queryDB, mapPageProperties } from "./utils/notion";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestGet({ env }) {
  try {
    initNotion(env);

    const response = await queryDB(env.DB_COURSE);
    const courses = response.results.map(mapPageProperties);

    return jsonResponse({ success: true, data: { courses } });
  } catch (error) {
    console.error("/api/course error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}
