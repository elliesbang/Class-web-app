export async function onRequest() {
  const tabs = [
    { key: 'globalNotice', label: '전체 공지' },
    { key: 'classroomVideo', label: '강의실 영상' },
    { key: 'vodVideo', label: 'VOD 영상' },
    { key: 'material', label: '자료' },
    { key: 'classroomNotice', label: '강의실 공지' },
  ];
  return Response.json(tabs);
}
