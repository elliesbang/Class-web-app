import { initNotion, queryDB, mapPageProperties } from "./utils/notion";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return jsonResponse({ success: false, error: "email, password, role are required" }, 400);
    }

    const databaseMap = {
      student: env.DB_STUDENT_ACCOUNT,
      admin: env.DB_ADMIN_ACCOUNT,
      vod: env.DB_VOD_ACCOUNT,
    };

    const databaseId = databaseMap[role];

    if (!databaseId) {
      return jsonResponse({ success: false, error: "Unsupported role" }, 400);
    }

    initNotion(env);

    const queryResponse = await queryDB(databaseId, {
      filter: { property: "Email", email: { equals: email } },
    });

    if (!queryResponse.results.length) {
      return jsonResponse({ success: false, error: "Invalid credentials" }, 401);
    }

    const user = mapPageProperties(queryResponse.results[0]);
    const storedPassword = user.Password || user.password || user.Passcode || null;

    if (storedPassword !== password) {
      return jsonResponse({ success: false, error: "Invalid credentials" }, 401);
    }

    return jsonResponse({ success: true, data: { user } });
  } catch (error) {
    console.error("/api/login error", error);
    return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
  }
}
