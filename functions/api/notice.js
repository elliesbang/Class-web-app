import { initNotion, queryDB, createPage, mapPageProperties } from "./utils/notion";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestGet({ env }) {
  try {
    initNotion(env);

    const response = await queryDB(env.DB_NOTICE);
    const notices = response.results.map(mapPageProperties);

    return jsonResponse({ success: true, data: { notices } });
  } catch (error) {
    console.error("/api/notice GET error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { title, body, date, adminName } = await request.json();

    if (!title || !body || !date || !adminName) {
      return jsonResponse({ success: false, error: "title, body, date, adminName are required" }, 400);
    }

    initNotion(env);

    const created = await createPage(env.DB_NOTICE, {
      Title: {
        title: [{ text: { content: title } }],
      },
      Body: {
        rich_text: [{ text: { content: body } }],
      },
      Date: {
        date: { start: date },
      },
      Author: {
        rich_text: [{ text: { content: adminName } }],
      },
    });

    const notice = mapPageProperties(created);

    return jsonResponse({ success: true, data: { notice } }, 201);
  } catch (error) {
    console.error("/api/notice POST error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}
