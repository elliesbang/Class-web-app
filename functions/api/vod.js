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

    const response = await queryDB(env.DB_VOD_VIDEO);
    const videos = response.results.map(mapPageProperties);

    return jsonResponse({ success: true, data: { videos } });
  } catch (error) {
    console.error("/api/vod GET error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { title, description, videoUrl, thumbnailUrl, week } = await request.json();

    if (!title || !videoUrl) {
      return jsonResponse({ success: false, error: "title and videoUrl are required" }, 400);
    }

    initNotion(env);

    const created = await createPage(env.DB_VOD_VIDEO, {
      Title: {
        title: [{ text: { content: title } }],
      },
      Description: {
        rich_text: description ? [{ text: { content: description } }] : [],
      },
      VideoUrl: {
        url: videoUrl,
      },
      ThumbnailUrl: {
        url: thumbnailUrl || null,
      },
      Week: {
        rich_text: week ? [{ text: { content: String(week) } }] : [],
      },
      PublishedAt: {
        date: { start: new Date().toISOString() },
      },
    });

    const video = mapPageProperties(created);

    return jsonResponse({ success: true, data: { video } }, 201);
  } catch (error) {
    console.error("/api/vod POST error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}
