export async function onRequest({ request }) {
  const url = new URL(request.url);

  // 페이지 구분용 파라미터 (없으면 기본값: classroom)
  const mode = url.searchParams.get("mode") || "classroom";

  let tabs = [
    { key: "globalNotice", label: "전체 공지" },
    { key: "classroomVideo", label: "강의실 영상" },
    { key: "vodVideo", label: "VOD 영상" },
    { key: "material", label: "자료" },
    { key: "classroomNotice", label: "강의실 공지" },
  ];

  // ⭐ 강의실에서는 VOD 탭 제거
  if (mode === "classroom") {
    tabs = tabs.filter((t) => t.key !== "vodVideo");
  }

  return Response.json(tabs);
}
