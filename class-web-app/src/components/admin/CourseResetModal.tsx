import AdminModal from './AdminModal';

type CourseResetModalProps = {
  isOpen: boolean;
  courses: string[];
  selectedCourse: string | null;
  onSelectCourse: (course: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

const CourseResetModal = ({ isOpen, courses, selectedCourse, onSelectCourse, onConfirm, onClose }: CourseResetModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <AdminModal title="기수별 초기화" subtitle="선택한 기수의 모든 과제와 피드백이 삭제됩니다." onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label htmlFor="course-select" className="block text-sm font-semibold text-[#404040]">
            기수(수업명) 선택
          </label>
          <select
            id="course-select"
            className="categorySelect mt-2 w-full rounded-xl border border-[#e9dccf] bg-[#fdf8f2] px-3 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none"
            value={selectedCourse ?? ''}
            onChange={(event) => onSelectCourse(event.target.value)}
          >
            <option value="" disabled>
              선택하기
            </option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl bg-[#fff5f5] p-4 text-sm text-[#a12c2c]">
          선택한 기수의 모든 과제와 피드백이 삭제됩니다. 정말 진행하시겠습니까?
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl bg-[#f5eee9] px-4 py-2 text-sm font-semibold text-[#404040] transition hover:bg-[#e9dccf]"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="rounded-xl bg-[#ff5f5f] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#e94b4b] disabled:cursor-not-allowed disabled:opacity-70"
            onClick={onConfirm}
            disabled={!selectedCourse}
          >
            초기화
          </button>
        </div>
      </div>
    </AdminModal>
  );
};

export default CourseResetModal;
