import { useEffect, useMemo, useState } from 'react';

import StudentTable from '../../components/admin/StudentTable';
import {
  getStudents,
  getVodStudents,
  type StudentAccountRow,
  type VodAccountRow,
} from '../../lib/studentAccounts';

type AccountType = 'student' | 'vod';

const toSearchableText = (value: string | undefined | null) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
};

const sortByName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' });

const AdminStudentManagement = () => {
  const [students, setStudents] = useState<StudentAccountRow[]>([]);
  const [vodStudents, setVodStudents] = useState<VodAccountRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [vodLoading, setVodLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<AccountType>('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('전체');

  useEffect(() => {
    const abortController = new AbortController();

    const loadStudents = async () => {
      setStudentsLoading(true);
      try {
        const result = await getStudents({ signal: abortController.signal });
        if (!abortController.signal.aborted) {
          setStudents(result);
        }
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
          return;
        }
        if (!abortController.signal.aborted) {
          setErrorMessage('수강생 데이터를 불러오지 못했습니다. 다시 시도해주세요.');
          setStudents([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setStudentsLoading(false);
        }
      }
    };

    void loadStudents();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const loadVodStudents = async () => {
      setVodLoading(true);
      try {
        const result = await getVodStudents({ signal: abortController.signal });
        if (!abortController.signal.aborted) {
          setVodStudents(result);
        }
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
          return;
        }
        if (!abortController.signal.aborted) {
          setErrorMessage('VOD 계정 데이터를 불러오지 못했습니다. 다시 시도해주세요.');
          setVodStudents([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setVodLoading(false);
        }
      }
    };

    void loadVodStudents();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    setStatusFilter('전체');
  }, [activeType]);

  const keyword = useMemo(() => toSearchableText(searchTerm), [searchTerm]);

  const filteredStudents = useMemo(() => {
    const normalised = keyword;

    return students
      .filter((student) => {
        const matchesKeyword =
          normalised.length === 0 ||
          [student.name, student.email, student.courseName, student.registeredAt]
            .map(toSearchableText)
            .some((value) => value.includes(normalised));

        const matchesStatus = statusFilter === '전체' || student.status === statusFilter;

        return matchesKeyword && matchesStatus;
      })
      .sort(sortByName);
  }, [keyword, statusFilter, students]);

  const filteredVodStudents = useMemo(() => {
    const normalised = keyword;

    return vodStudents
      .filter((student) => {
        const matchesKeyword =
          normalised.length === 0 ||
          [student.name, student.email, student.vodAccess, student.subscriptionEndsAt]
            .map(toSearchableText)
            .some((value) => value.includes(normalised));

        const matchesStatus = statusFilter === '전체' || student.status === statusFilter;

        return matchesKeyword && matchesStatus;
      })
      .sort(sortByName);
  }, [keyword, statusFilter, vodStudents]);

  const isStudentView = activeType === 'student';
  const rows = isStudentView ? filteredStudents : filteredVodStudents;
  const isLoading = isStudentView ? studentsLoading : vodLoading;

  const statusOptions = useMemo(() => {
    const target = isStudentView ? students : vodStudents;
    const uniqueStatuses = Array.from(new Set(target.map((item) => item.status).filter(Boolean)));
    return ['전체', ...uniqueStatuses.sort((a, b) => a.localeCompare(b, 'ko', { sensitivity: 'base' }))];
  }, [isStudentView, students, vodStudents]);

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-20 -mx-6 mb-2 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold text-[#404040]">수강생 관리</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="이름, 이메일 또는 세부 정보를 검색하세요"
                className="w-full rounded-full border border-[#e9dccf] bg-white py-2 pl-10 pr-4 text-sm text-[#404040] shadow-sm focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveType('student')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all hover:shadow-lg ${
                  isStudentView
                    ? 'border border-[#ffd331] bg-[#ffd331]/90 text-[#404040]'
                    : 'border border-[#e9dccf] bg-white text-[#5c5c5c]'
                }`}
              >
                수강생
              </button>
              <button
                type="button"
                onClick={() => setActiveType('vod')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all hover:shadow-lg ${
                  !isStudentView
                    ? 'border border-[#ffd331] bg-[#ffd331]/90 text-[#404040]'
                    : 'border border-[#e9dccf] bg-white text-[#5c5c5c]'
                }`}
              >
                VOD
              </button>
            </div>
            <select
              className="rounded-full border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] shadow-sm focus:border-[#ffd331] focus:outline-none"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <StudentTable
          type={activeType}
          records={rows}
          isLoading={isLoading}
          emptyMessage={
            isStudentView
              ? '조건에 맞는 수강생이 없습니다.'
              : '조건에 맞는 VOD 구독자가 없습니다.'
          }
        />
      </section>
    </div>
  );
};

export default AdminStudentManagement;

