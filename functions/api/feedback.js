import { initNotion, createPage, mapPageProperties } from "./utils/notion";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const { assignmentId, feedbackText, adminName } = await request.json();

    if (!assignmentId || !feedbackText || !adminName) {
      return jsonResponse({ success: false, error: "assignmentId, feedbackText, adminName are required" }, 400);
    }

    initNotion(env);

    const created = await createPage(env.DB_FEEDBACK, {
      Assignment: {
        relation: [{ id: assignmentId }],
      },
      Feedback: {
        rich_text: [{ text: { content: feedbackText } }],
      },
      Admin: {
        rich_text: [{ text: { content: adminName } }],
      },
      CreatedAt: {
        date: { start: new Date().toISOString() },
      },
    });

    const feedback = mapPageProperties(created);

    return jsonResponse({ success: true, data: { feedback } }, 201);
  } catch (error) {
    console.error("/api/feedback error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}
