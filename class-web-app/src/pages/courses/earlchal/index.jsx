import CourseLayout from '../shared/CourseLayout';

function EarlChalCoursePage() {
  const materialResources = [
    {
      id: 'earlchal-guide',
      title: '이얼챌 수업 안내서',
      description: '챌린지 참여 방법과 과제 제출 절차를 정리한 PDF 자료입니다.',
      fileUrl: 'https://example.com/earlchal/class-guide.pdf',
    },
    {
      id: 'earlchal-week1',
      title: '1주차 서예 워크시트',
      description: '기본 획 연습을 위한 워크시트와 참고 이미지를 다운받아 연습해 보세요.',
      fileUrl: 'https://example.com/earlchal/week1-workbook.pdf',
    },
  ];

  return (
    <CourseLayout
      courseId="earlchal"
      courseName="이얼챌"
      description="중국어 캘리그라피 챌린지 수업을 위한 전용 강의실입니다. 영상 시청과 과제 업로드를 이곳에서 진행하세요."
      materials={materialResources}
    />
  );
}

export default EarlChalCoursePage;
