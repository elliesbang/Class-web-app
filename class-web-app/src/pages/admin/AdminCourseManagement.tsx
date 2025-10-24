import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type CourseType = '강의' | '챌린지' | '특강' | '원데이';

type CourseStatus = '진행 중' | '준비 중' | '종료';

type Student = {
  name: string;
  email: string;
};

type CourseMetrics = {
  videos: number;
  materials: number;
  notices: number;
  assignmentSubmissionRate: number;
  feedbackCompletionRate: number;
};

type Course = {
  id: number;
  title: string;
  type: CourseType;
  startDate: string;
  endDate: string;
  uploadPeriod: string;
  status: CourseStatus;
  manager: string;
  description?: string;
  students: Student[];
  createdAt: string;
  metrics: CourseMetrics;
};

type UploadRecord = {
  id: number;
  name: string;
  email: string;
  courseId: number;
  courseTitle: string;
  uploadedAt: string;
};

type DecompressionStreamCtor = new (format: 'deflate' | 'deflate-raw' | 'gzip') => TransformStream<Uint8Array, Uint8Array>;

const statusOrder: CourseStatus[] = ['준비 중', '진행 중', '종료'];

const statusColors: Record<CourseStatus, string> = {
  '진행 중': 'bg-green-100 text-green-700 border border-green-300',
  '준비 중': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  종료: 'bg-gray-100 text-gray-600 border border-gray-300',
};

const typeFilterOptions: Array<'전체' | CourseType> = ['전체', '강의', '챌린지', '특강', '원데이'];
const statusFilterOptions: Array<'전체' | CourseStatus> = ['전체', '진행 중', '준비 중', '종료'];

const initialCourses: Course[] = [
  {
    id: 1,
    title: '미치나 8기',
    type: '챌린지',
    startDate: '2025-11-01',
    endDate: '2025-11-21',
    uploadPeriod: '00:00 ~ 23:59',
    status: '진행 중',
    manager: '관리자',
    description: '3주간 미리캔버스 요소 업로드 챌린지',
    students: [
      { name: '홍길동', email: 'test@test.com' },
      { name: '이영희', email: 'lee@test.com' },
    ],
    createdAt: '2025-10-15T09:00:00Z',
    metrics: {
      videos: 8,
      materials: 5,
      notices: 3,
      assignmentSubmissionRate: 86,
      feedbackCompletionRate: 72,
    },
  },
  {
    id: 2,
    title: '캔디마 2기',
    type: '강의',
    startDate: '2025-12-02',
    endDate: '2025-12-31',
    uploadPeriod: '06:00 ~ 23:59',
    status: '준비 중',
    manager: '김민지',
    description: '디자인 마케팅 실전 강의 프로그램',
    students: [
      { name: '이준호', email: 'leej@example.com' },
      { name: '정소영', email: 'soyoung@example.com' },
    ],
    createdAt: '2025-10-20T04:00:00Z',
    metrics: {
      videos: 0,
      materials: 2,
      notices: 1,
      assignmentSubmissionRate: 0,
      feedbackCompletionRate: 0,
    },
  },
  {
    id: 3,
    title: '나캔디 1기 원데이 워크샵',
    type: '원데이',
    startDate: '2025-11-05',
    endDate: '2025-11-05',
    uploadPeriod: '09:00 ~ 18:00',
    status: '종료',
    manager: '관리자',
    description: '원데이 실습 워크샵',
    students: [
      { name: '박서연', email: 'seo@example.com' },
      { name: '최가영', email: 'gayeong@example.com' },
    ],
    createdAt: '2025-09-25T14:00:00Z',
    metrics: {
      videos: 4,
      materials: 6,
      notices: 2,
      assignmentSubmissionRate: 92,
      feedbackCompletionRate: 88,
    },
  },
];

const AdminCourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'전체' | CourseType>('전체');
  const [statusFilter, setStatusFilter] = useState<'전체' | CourseStatus>('전체');
  const [sortOption, setSortOption] = useState<'latest' | 'status'>('latest');
  const [showAddForm, setShowAddForm] = useState(false);

  const [courseForm, setCourseForm] = useState({
    title: '',
    type: '강의' as CourseType,
    startDate: '',
    endDate: '',
    uploadPeriod: '',
    manager: '관리자',
    description: '',
  });

  const [selectedCourseIdForUpload, setSelectedCourseIdForUpload] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadRecords, setUploadRecords] = useState<UploadRecord[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInputKey, setUploadInputKey] = useState(0);

  const navigate = useNavigate();

  const filteredCourses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const filtered = courses.filter((course) => {
      const matchesKeyword =
        keyword.length === 0 ||
        [course.title, course.manager, course.status]
          .join(' ')
          .toLowerCase()
          .includes(keyword);
      const matchesType = typeFilter === '전체' || course.type === typeFilter;
      const matchesStatus = statusFilter === '전체' || course.status === statusFilter;

      return matchesKeyword && matchesType && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      const aOrder = statusOrder.indexOf(a.status);
      const bOrder = statusOrder.indexOf(b.status);

      if (aOrder === bOrder) {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }

      return aOrder - bOrder;
    });
  }, [courses, searchTerm, typeFilter, statusFilter, sortOption]);

  const courseOptions = useMemo(
    () =>
      courses.map((course) => ({
        value: String(course.id),
        label: course.title,
      })),
    [courses],
  );

  const handleStatusToggle = (courseId: number) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;
        const currentIndex = statusOrder.indexOf(course.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        return { ...course, status: nextStatus };
      }),
    );
  };

  const handleDeleteCourse = (courseId: number) => {
    const targetCourse = courses.find((course) => course.id === courseId);
    const courseTitle = targetCourse?.title ?? '선택한 수업';
    if (window.confirm(`‘${courseTitle}’ 수업을 삭제하시겠습니까?`)) {
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      type: '강의',
      startDate: '',
      endDate: '',
      uploadPeriod: '',
      manager: '관리자',
      description: '',
    });
  };

  const handleAddCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courseForm.title || !courseForm.startDate || !courseForm.endDate || !courseForm.uploadPeriod) {
      return;
    }

    const newCourse: Course = {
      id: Date.now(),
      title: courseForm.title,
      type: courseForm.type,
      startDate: courseForm.startDate,
      endDate: courseForm.endDate,
      uploadPeriod: courseForm.uploadPeriod,
      status: '준비 중',
      manager: courseForm.manager || '관리자',
      description: courseForm.description,
      students: [],
      createdAt: new Date().toISOString(),
      metrics: {
        videos: 0,
        materials: 0,
        notices: 0,
        assignmentSubmissionRate: 0,
        feedbackCompletionRate: 0,
      },
    };

    setCourses((prev) => [newCourse, ...prev]);
    resetCourseForm();
    setShowAddForm(false);
  };

  const handleCourseFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setCourseForm((prev) => ({ ...prev, [name]: value }));
  };

  const parseCsv = async (file: File): Promise<Student[]> => {
    const text = await file.text();
    const lines = text
      .replace(/\uFEFF/g, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const rows = lines.map((line) => line.split(',').map((cell) => cell.trim()));

    return rows
      .map(([name, email]) => ({ name, email }))
      .filter((student) =>
        student.name &&
        student.email &&
        student.name !== '이름' &&
        student.email !== '이메일',
      );
  };

  const parseXlsx = async (file: File): Promise<Student[]> => {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    const view = new DataView(buffer);

    const textDecoder = new TextDecoder('utf-8');

    const findEndOfCentralDirectory = () => {
      for (let i = data.length - 22; i >= 0; i -= 1) {
        if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x05 && data[i + 3] === 0x06) {
          return i;
        }
      }
      return -1;
    };

    const eocdIndex = findEndOfCentralDirectory();
    if (eocdIndex < 0) {
      throw new Error('유효한 XLSX 형식이 아닙니다.');
    }

    const centralDirectoryOffset = view.getUint32(eocdIndex + 16, true);
    const centralDirectorySize = view.getUint32(eocdIndex + 12, true);

    type ZipEntry = {
      compressionMethod: number;
      compressedSize: number;
      uncompressedSize: number;
      localHeaderOffset: number;
    };

    const entries = new Map<string, ZipEntry>();

    let offset = centralDirectoryOffset;
    const end = centralDirectoryOffset + centralDirectorySize;

    while (offset < end) {
      const signature = view.getUint32(offset, true);
      if (signature !== 0x02014b50) {
        break;
      }

      const compressionMethod = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const uncompressedSize = view.getUint32(offset + 24, true);
      const fileNameLength = view.getUint16(offset + 28, true);
      const extraFieldLength = view.getUint16(offset + 30, true);
      const fileCommentLength = view.getUint16(offset + 32, true);
      const localHeaderOffset = view.getUint32(offset + 42, true);

      const fileNameBytes = data.slice(offset + 46, offset + 46 + fileNameLength);
      const fileName = textDecoder.decode(fileNameBytes);

      entries.set(fileName, {
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset,
      });

      offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
    }

    const targetFiles = ['xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml'];

    const extractEntry = async (path: string): Promise<Uint8Array | null> => {
      const entry = entries.get(path);
      if (!entry) return null;

      const localHeaderSignature = view.getUint32(entry.localHeaderOffset, true);
      if (localHeaderSignature !== 0x04034b50) {
        return null;
      }

      const fileNameLength = view.getUint16(entry.localHeaderOffset + 26, true);
      const extraFieldLength = view.getUint16(entry.localHeaderOffset + 28, true);
      const dataStart = entry.localHeaderOffset + 30 + fileNameLength + extraFieldLength;
      const compressedData = data.slice(dataStart, dataStart + entry.compressedSize);

      if (entry.compressionMethod === 0) {
        return compressedData;
      }

      if (entry.compressionMethod === 8) {
        const DecompressionCtor = (globalThis as typeof globalThis & {
          DecompressionStream?: new (format: 'deflate' | 'deflate-raw' | 'gzip') => TransformStream<Uint8Array, Uint8Array>;
        }).DecompressionStream;

        if (!DecompressionCtor) {
          throw new Error('브라우저에서 XLSX 압축 해제를 지원하지 않습니다.');
        }

        const stream = new Blob([compressedData]).stream().pipeThrough(new DecompressionCtor('deflate-raw'));
        const decompressedBuffer = await new Response(stream).arrayBuffer();
        return new Uint8Array(decompressedBuffer);
      }

      throw new Error('지원하지 않는 XLSX 압축 방식입니다.');
    };

    const [sharedStringsBytes, sheetBytes] = await Promise.all(targetFiles.map((path) => extractEntry(path)));

    if (!sheetBytes) {
      throw new Error('시트 데이터를 찾을 수 없습니다.');
    }

    const parser = new DOMParser();

    const sharedStrings: string[] = [];
    if (sharedStringsBytes) {
      const sharedXml = parser.parseFromString(textDecoder.decode(sharedStringsBytes), 'application/xml');
      sharedXml.querySelectorAll('si').forEach((si) => {
        const texts = Array.from(si.querySelectorAll('t'));
        const value = texts.map((node) => node.textContent ?? '').join('');
        sharedStrings.push(value);
      });
    }

    const sheetXml = parser.parseFromString(textDecoder.decode(sheetBytes), 'application/xml');
    const rows: Student[] = [];

    Array.from(sheetXml.getElementsByTagName('row')).forEach((row) => {
      const cells = Array.from(row.getElementsByTagName('c'));
      const values: Record<string, string> = {};

      cells.forEach((cell) => {
        const ref = cell.getAttribute('r') ?? '';
        const column = ref.replace(/\d/g, '');
        const type = cell.getAttribute('t');
        const valueElement = cell.getElementsByTagName('v')[0];
        let cellValue = valueElement?.textContent ?? '';

        if (type === 's') {
          const sharedIndex = Number(cellValue);
          if (!Number.isNaN(sharedIndex) && sharedStrings[sharedIndex]) {
            cellValue = sharedStrings[sharedIndex];
          }
        } else if (type === 'inlineStr') {
          const inline = cell.getElementsByTagName('t')[0];
          cellValue = inline?.textContent ?? cellValue;
        }

        values[column || String(Object.keys(values).length)] = cellValue?.trim() ?? '';
      });

      const name = values.A ?? values.a ?? '';
      const email = values.B ?? values.b ?? '';

      if (name && email && name !== '이름' && email !== '이메일') {
        rows.push({ name, email });
      }
    });

    return rows;
  };

  const handleUploadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCourseIdForUpload) {
      setUploadError('수업을 선택해주세요.');
      setUploadMessage(null);
      return;
    }

    if (!uploadFile) {
      setUploadError('업로드할 파일을 선택해주세요.');
      setUploadMessage(null);
      return;
    }

    const courseId = Number(selectedCourseIdForUpload);
    const targetCourse = courses.find((course) => course.id === courseId);

    if (!targetCourse) {
      setUploadError('선택한 수업을 찾을 수 없습니다.');
      setUploadMessage(null);
      return;
    }

    try {
      let parsedStudents: Student[] = [];

      if (uploadFile.name.toLowerCase().endsWith('.csv')) {
        parsedStudents = await parseCsv(uploadFile);
      } else if (uploadFile.name.toLowerCase().endsWith('.xlsx')) {
        parsedStudents = await parseXlsx(uploadFile);
      } else {
        setUploadError('지원하지 않는 파일 형식입니다. (.csv 또는 .xlsx)');
        setUploadMessage(null);
        return;
      }

      if (parsedStudents.length === 0) {
        setUploadError('파일에서 유효한 수강생 정보를 찾지 못했습니다.');
        setUploadMessage(null);
        return;
      }

      const uploadedAt = new Date().toISOString();

      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? {
                ...course,
                students: [...course.students, ...parsedStudents],
              }
            : course,
        ),
      );

      setUploadRecords((prev) => [
        ...parsedStudents.map((student) => ({
          id: Date.now() + Math.random(),
          name: student.name,
          email: student.email,
          courseId,
          courseTitle: targetCourse.title,
          uploadedAt,
        })),
        ...prev,
      ]);

      setUploadMessage(`${parsedStudents.length}명의 수강생 정보를 업로드했습니다.`);
      setUploadError(null);
      setUploadFile(null);
      setSelectedCourseIdForUpload('');
      setUploadInputKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      setUploadError('명단 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
      setUploadMessage(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#404040]">수업 관리</h2>
            <p className="text-sm text-[#5c5c5c]">등록된 모든 수업을 확인하고 상태와 기본 정보를 관리하세요.</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-[#ffd331] px-5 py-2 font-semibold text-[#404040] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e6bd2c]"
            onClick={() => setShowAddForm((prev) => !prev)}
          >
            + 새 수업 추가
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="course-search">
              검색
            </label>
            <input
              id="course-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="수업명, 담당자, 상태로 검색"
              className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="type-filter">
              유형 필터
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as '전체' | CourseType)}
              className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
            >
              {typeFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="status-filter">
              상태 필터
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as '전체' | CourseStatus)}
              className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
            >
              {statusFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[#5c5c5c]">
            총 <span className="font-semibold text-[#404040]">{filteredCourses.length}</span>개의 수업이 검색되었습니다.
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-[#404040]" htmlFor="sort-option">
              정렬
            </label>
            <select
              id="sort-option"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as 'latest' | 'status')}
              className="rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-3 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
            >
              <option value="latest">최신 등록순</option>
              <option value="status">상태순</option>
            </select>
          </div>
        </div>
      </section>

      {showAddForm && (
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h3 className="mb-4 text-xl font-semibold text-[#404040]">새 수업 추가</h3>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddCourse}>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="title">
                수업명
              </label>
              <input
                id="title"
                name="title"
                value={courseForm.title}
                onChange={handleCourseFormChange}
                placeholder="수업명을 입력하세요"
                className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="type">
                수업 유형
              </label>
              <select
                id="type"
                name="type"
                value={courseForm.type}
                onChange={handleCourseFormChange}
                className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
              >
                <option value="강의">강의</option>
                <option value="챌린지">챌린지</option>
                <option value="특강">특강</option>
                <option value="원데이">원데이</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="manager">
                담당 관리자
              </label>
              <input
                id="manager"
                name="manager"
                value={courseForm.manager}
                onChange={handleCourseFormChange}
                placeholder="담당자를 입력하세요"
                className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="startDate">
                시작일
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={courseForm.startDate}
                onChange={handleCourseFormChange}
                className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="endDate">
                종료일
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={courseForm.endDate}
                onChange={handleCourseFormChange}
                className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="uploadPeriod">
                업로드 가능 시간
              </label>
              <input
                id="uploadPeriod"
                name="uploadPeriod"
                value={courseForm.uploadPeriod}
                onChange={handleCourseFormChange}
                placeholder="예: 00:00 ~ 23:59"
                className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="description">
                수업 설명 (선택)
              </label>
              <textarea
                id="description"
                name="description"
                value={courseForm.description}
                onChange={handleCourseFormChange}
                rows={3}
                placeholder="수업에 대한 설명을 입력하세요"
                className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-[#e9dccf] px-5 py-2 text-sm font-semibold text-[#5c5c5c] transition-all hover:-translate-y-0.5 hover:border-[#ffd331] hover:text-[#404040]"
                onClick={() => {
                  resetCourseForm();
                  setShowAddForm(false);
                }}
              >
                취소
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e6bd2c]"
              >
                등록
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="space-y-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-md">
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-[#f0e3d8]">
              <thead className="bg-[#fdf7f0]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">수업명</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">유형</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">시작일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">종료일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">업로드 가능 시간</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">담당 관리자</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e3d8] bg-white">
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="cursor-pointer transition-all hover:bg-[#fdf7f0]/70"
                    onClick={() => navigate(`/admin/courses/${course.id}`)}
                  >
                    <td className="px-4 py-4 text-sm font-semibold text-[#404040]">{course.title}</td>
                    <td className="px-4 py-4 text-sm text-[#5c5c5c]">{course.type}</td>
                    <td className="px-4 py-4 text-sm text-[#5c5c5c]">{course.startDate}</td>
                    <td className="px-4 py-4 text-sm text-[#5c5c5c]">{course.endDate}</td>
                    <td className="px-4 py-4 text-sm text-[#5c5c5c]">{course.uploadPeriod}</td>
                    <td className="px-4 py-4 text-sm text-[#5c5c5c]">
                      <button
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all hover:-translate-y-0.5 ${statusColors[course.status]}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStatusToggle(course.id);
                        }}
                      >
                        {course.status}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#5c5c5c]">{course.manager}</td>
                    <td className="px-4 py-4 text-right text-sm text-[#5c5c5c]">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-[#e9dccf] px-3 py-1 text-xs font-semibold text-[#5c5c5c] transition-all hover:-translate-y-0.5 hover:border-[#ffd331] hover:text-[#404040]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[#e9dccf] px-3 py-1 text-xs font-semibold text-[#c25a4f] transition-all hover:-translate-y-0.5 hover:border-[#ffd331] hover:text-[#a13f35]"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-[#f0e3d8] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => navigate(`/admin/courses/${course.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    navigate(`/admin/courses/${course.id}`);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-[#404040]">{course.title}</h4>
                    <p className="text-xs text-[#5c5c5c]">{course.type}</p>
                  </div>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[course.status]}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleStatusToggle(course.id);
                    }}
                  >
                    {course.status}
                  </button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5c5c5c]">
                  <div>
                    <dt className="font-semibold text-[#404040]">기간</dt>
                    <dd>
                      {course.startDate} ~ {course.endDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#404040]">업로드</dt>
                    <dd>{course.uploadPeriod}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#404040]">담당</dt>
                    <dd>{course.manager}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#404040]">수강생</dt>
                    <dd>{course.students.length}명</dd>
                  </div>
                </dl>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-[#e9dccf] px-3 py-1 text-xs font-semibold text-[#5c5c5c]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-[#e9dccf] px-3 py-1 text-xs font-semibold text-[#c25a4f]"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteCourse(course.id);
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-[#e9dccf] bg-white/70 px-4 py-6 text-center text-sm text-[#a18f80]">
          페이징 영역 (추후 구현 예정)
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-md">
        <h3 className="text-xl font-semibold text-[#404040]">수강생 명단 업로드</h3>
        <p className="mt-1 text-sm text-[#5c5c5c]">
          업로드할 수업을 선택하고 엑셀(.xlsx) 또는 CSV(.csv) 파일을 업로드해주세요.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleUploadSubmit}>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="course-selector">
                수업 선택
              </label>
              <select
                id="course-selector"
                value={selectedCourseIdForUpload}
                onChange={(event) => setSelectedCourseIdForUpload(event.target.value)}
                className="w-full rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
              >
                <option value="">수업을 선택하세요</option>
                {courseOptions.map((course) => (
                  <option key={course.value} value={course.value}>
                    {course.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-[#404040]" htmlFor="student-file">
                파일 업로드
              </label>
              <input
                key={uploadInputKey}
                id="student-file"
                type="file"
                accept=".csv,.xlsx"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="w-full cursor-pointer rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] file:mr-4 file:rounded-full file:border-0 file:bg-[#ffd331] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#404040] file:transition-all file:hover:bg-[#e6bd2c]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-full bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e6bd2c] md:w-auto"
              >
                명단 업로드
              </button>
            </div>
          </div>

          {uploadMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {uploadMessage}
            </div>
          )}
          {uploadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {uploadError}
            </div>
          )}
        </form>

        {uploadRecords.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#f0e3d8]">
            <table className="min-w-full divide-y divide-[#f0e3d8]">
              <thead className="bg-[#fdf7f0]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">소속 수업</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">업로드 날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e3d8] bg-white">
                {uploadRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 text-sm text-[#404040]">{record.name}</td>
                    <td className="px-4 py-3 text-sm text-[#5c5c5c]">{record.email}</td>
                    <td className="px-4 py-3 text-sm text-[#5c5c5c]">{record.courseTitle}</td>
                    <td className="px-4 py-3 text-sm text-[#5c5c5c]">
                      {new Date(record.uploadedAt).toLocaleString('ko-KR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
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
