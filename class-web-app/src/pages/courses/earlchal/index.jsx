import CourseLayout from '../shared/CourseLayout';

function EarlChalCoursePage() {
  const materialResources = [];

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
