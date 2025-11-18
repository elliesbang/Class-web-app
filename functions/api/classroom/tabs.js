export async function onRequest({ request }) {
  const tabs = [
    { key: "classroomVideo", label: "강의실 영상" },
    { key: "material", label: "자료" },
    { key: "assignment", label: "과제" },
    { key: "feedback", label: "피드백" },
    { key: "classroomNotice", label: "강의실 공지" }
  ];

  return Response.json(tabs);
}
