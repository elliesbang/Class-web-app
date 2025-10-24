import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminClasses } from './data/AdminClassContext';

const AdminCourseManagement = () => {
  const { classes, isLoading, error, refresh, createClass } = useAdminClasses();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const filteredClasses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (keyword.length === 0) {
      return classes;
    }
    return classes.filter((classItem) => classItem.name.toLowerCase().includes(keyword));
  }, [classes, searchTerm]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = newClassName.trim();
    if (!trimmed) {
      setSubmitError('수업명을 입력해주세요.');
      setSubmitMessage(null);
      return;
    }

    setSubmitError(null);
    setSubmitMessage(null);
    setIsSubmitting(true);
    try {
      const created = await createClass({ name: trimmed });
      setSubmitMessage(`‘${created.name}’ 수업이 등록되었습니다.`);
      setNewClassName('');
      setIsAdding(false);
    } catch (caught) {
      console.error('Failed to create class', caught);
      setSubmitError(caught instanceof Error ? caught.message : '수업 등록 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setSubmitMessage(null);
    setSubmitError(null);
    try {
      await refresh();
    } catch (caught) {
      console.error('Failed to refresh classes', caught);
      setSubmitError(caught instanceof Error ? caught.message : '수업 목록을 새로 고칠 수 없습니다.');
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#404040]">수업 관리</h2>
            <p className="text-sm text-[#5c5c5c]">등록된 수업을 확인하고 새 수업을 추가할 수 있습니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-full border border-[#ffd331] px-4 py-2 text-sm font-semibold text-[#404040] transition-colors hover:bg-[#fff5c2]"
            >
              목록 새로고침
            </button>
            <button
              type="button"
              className="rounded-full bg-[#ffd331] px-5 py-2 text-sm font-semibold text-[#404040] shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[#e6bd2c]"
              onClick={() => {
                setIsAdding((prev) => !prev);
                setSubmitError(null);
                setSubmitMessage(null);
              }}
            >
              {isAdding ? '추가 취소' : '+ 새 수업 추가'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex-1 text-sm font-semibold text-[#404040]" htmlFor="class-search">
            <span className="mb-2 block">수업 검색</span>
            <input
              id="class-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="수업명을 입력하세요"
              className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
            />
          </label>
          <div className="text-sm text-[#5c5c5c]">
            총 <span className="font-semibold text-[#404040]">{filteredClasses.length}</span>개의 수업이 등록되어 있습니다.
          </div>
        </div>

        {isAdding && (
          <form className="mt-6 grid gap-4 rounded-2xl border border-[#f0e3d8] bg-[#fdf7f0] p-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="new-class-name">
                수업명
              </label>
              <input
                id="new-class-name"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                placeholder="예: 미치나 8기"
                className="w-full rounded-xl border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[#e9dccf] px-4 py-2 text-sm font-semibold text-[#5c5c5c] transition-colors hover:bg-[#f5eee9]"
                onClick={() => {
                  setIsAdding(false);
                  setNewClassName('');
                }}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#ffd331] px-5 py-2 text-sm font-semibold text-[#404040] shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[#e6bd2c] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? '등록 중...' : '수업 등록'}
              </button>
            </div>
            {submitError && <p className="text-sm font-semibold text-red-500">{submitError}</p>}
            {submitMessage && <p className="text-sm font-semibold text-green-600">{submitMessage}</p>}
          </form>
        )}

        {submitMessage && !isAdding && (
          <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{submitMessage}</p>
        )}
        {submitError && !isAdding && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{submitError}</p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#404040]">수업 목록</h3>
          {isLoading && <span className="text-sm text-[#5c5c5c]">불러오는 중...</span>}
        </div>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
        )}
        {filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e9dccf] bg-[#fdf7f0]/60 px-6 py-16 text-center text-sm text-[#5c5c5c]">
            <p className="text-base font-semibold text-[#404040]">등록된 수업이 없습니다.</p>
            <p className="mt-2 text-sm text-[#7a6f68]">새 수업을 추가하면 이곳에서 바로 확인할 수 있습니다.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#f0e3d8]">
            <table className="min-w-full divide-y divide-[#f0e3d8] text-sm">
              <thead className="bg-[#fff7d6] text-[#404040]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">수업명</th>
                  <th className="px-4 py-3 text-left font-semibold">수업 ID</th>
                  <th className="px-4 py-3 text-left font-semibold">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e3d8] bg-white">
                {filteredClasses.map((classItem) => (
                  <tr key={classItem.id} className="transition-colors hover:bg-[#fdf7f0]">
                    <td className="px-4 py-3 font-semibold text-[#404040]">{classItem.name}</td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{classItem.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-[#e9dccf] px-3 py-1 text-xs font-semibold text-[#5c5c5c] transition-colors hover:bg-[#f5eee9]"
                          onClick={() => navigate(`/admin/courses/${classItem.id}`)}
                        >
                          상세 보기
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[#e9dccf] px-3 py-1 text-xs font-semibold text-[#404040] transition-colors hover:bg-[#fff5c2]"
                          onClick={() => navigate('/admin/content', { state: { classId: classItem.id } })}
                        >
                          콘텐츠 관리로 이동
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminCourseManagement;
