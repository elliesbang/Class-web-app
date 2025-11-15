import { initNotion, createPage, mapPageProperties } from "./utils/notion";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const { student, week, link, comment } = await request.json();

    if (!student || !week || !link) {
      return jsonResponse({ success: false, error: "student, week, link are required" }, 400);
    }

    initNotion(env);

    const submittedAt = new Date().toISOString();

    const created = await createPage(env.DB_ASSIGNMENT, {
      Student: {
        title: [{ text: { content: String(student) } }],
      },
      Week: {
        rich_text: [{ text: { content: String(week) } }],
      },
      Link: {
        url: link,
      },
      Comment: {
        rich_text: comment ? [{ text: { content: comment } }] : [],
      },
      SubmittedAt: {
        date: { start: submittedAt },
      },
    });

    const assignment = mapPageProperties(created);

    return jsonResponse({ success: true, data: { assignment } }, 201);
  } catch (error) {
    console.error("/api/assignment-submit error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}
