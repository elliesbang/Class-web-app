export async function onRequest({ request }) {
  const tabs = [
    { key: "classroomVideo", label: "강의실 영상" },
    { key: "material", label: "자료" },
    { key: "classroomNotice", label: "강의실 공지" }
  ];

  tabs.push(
    { tab: "assignment", label: "과제" },
    { tab: "feedback", label: "피드백" }
  );

  return Response.json(tabs);
}
