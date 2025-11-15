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

    const databaseConfigs = [
      { key: "classrooms", id: env.DB_CLASSROOM_LIST },
      { key: "assignments", id: env.DB_ASSIGNMENT },
      { key: "feedback", id: env.DB_FEEDBACK },
      { key: "notices", id: env.DB_NOTICE },
      { key: "activityLogs", id: env.DB_ACTIVITY_LOG },
    ];

    const results = await Promise.all(
      databaseConfigs.map(async ({ key, id }) => ({
        key,
        response: await queryDB(id),
      }))
    );

    const summary = results.reduce((acc, { key, response }) => {
      acc[key] = response.results.length;
      return acc;
    }, {});

    return jsonResponse({ success: true, data: { summary } });
  } catch (error) {
    console.error("/api/admin GET error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { action, actor, details } = await request.json();

    if (!action || !actor) {
      return jsonResponse({ success: false, error: "action and actor are required" }, 400);
    }

    initNotion(env);

    const created = await createPage(env.DB_ACTIVITY_LOG, {
      Action: {
        title: [{ text: { content: action } }],
      },
      Actor: {
        rich_text: [{ text: { content: actor } }],
      },
      Details: {
        rich_text: details ? [{ text: { content: details } }] : [],
      },
      LoggedAt: {
        date: { start: new Date().toISOString() },
      },
    });

    const activity = mapPageProperties(created);

    return jsonResponse({ success: true, data: { activity } }, 201);
  } catch (error) {
    console.error("/api/admin POST error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}
