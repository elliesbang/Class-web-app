import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { getStoredAuthUser } from '../../lib/authUser';
import { createClass, updateClass, type AssignmentUploadTimeOption, type ClassFormPayload, type ClassInfo } from '../../lib/api';
import { useAdminClasses } from './data/AdminClassContext';

const DELIVERY_METHOD_OPTIONS = ['영상보기', '과제업로드', '피드백보기', '공지보기', '자료보기'];
const WEEKDAY_OPTIONS = ['월', '화', '수', '목', '금', '토', '일'];
const ASSIGNMENT_UPLOAD_TIME_LABELS: Record<AssignmentUploadTimeOption, string> = {
  all_day: '24시간 가능',
  same_day: '하루 한정',
};

const extractCategoryName = (value: unknown): string => {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidate =
      record.name ?? record.categoryName ?? record.category ?? record.title ?? record.label ?? record.text;

    if (typeof candidate === 'string') {
      return candidate.trim();
    }

    if (candidate != null) {
      return String(candidate).trim();
    }
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }

  return '';
};

const toUniqueCategoryNames = (input: unknown[]): string[] => {
  const names = input
    .map((item) => extractCategoryName(item))
    .filter((name): name is string => name.length > 0);

  return Array.from(new Set(names));
};

type ClassFormState = {
  name: string;
  code: string;
  category: string;
  startDate: string;
  endDate: string;
  assignmentUploadTime: AssignmentUploadTimeOption;
  assignmentUploadDays: string[];
  deliveryMethods: string[];
  isActive: boolean;
};

const generateClassCode = () => {
  const year = new Date().getFullYear();
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let index = 0; index < 4; index += 1) {
    suffix += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `CL-${year}-${suffix}`;
};

const toDateInputValue = (value: string | null) => {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return value.slice(0, 10);
};

const createInitialFormState = (defaultCategory: string): ClassFormState => ({
  name: '',
  code: generateClassCode(),
  category: defaultCategory,
  startDate: '',
  endDate: '',
  assignmentUploadTime: 'all_day',
  assignmentUploadDays: [...WEEKDAY_OPTIONS],
  deliveryMethods: ['영상보기'],
  isActive: true,
});

const normaliseDays = (input: string[]) => {
  const set = new Set(input);
  return WEEKDAY_OPTIONS.filter((day) => set.has(day));
};

const AdminClassManagement = () => {
  const { classes, isLoading: isClassListLoading, error, refresh } = useAdminClasses();
  const [filters, setFilters] = useState({ category: '전체' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<ClassFormState>(() => createInitialFormState(''));
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    categoryOptions.forEach((item) => {
      const value = item.trim();
      if (value.length > 0) {
        set.add(value);
      }
    });
    classes.forEach((item) => {
      if (item.category && item.category.trim().length > 0) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko', { sensitivity: 'base' }));
  }, [categoryOptions, classes]);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadCategories = async () => {
      if (!isMounted) {
        return;
      }

      setIsCategoryLoading(true);
      setCategoryOptions([]);
      setCategoryError(null);

      try {
        const token = getStoredAuthUser()?.token ?? '';
        const response = await fetch('/api/class_category/list', {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted) {
          return;
        }
        if (!response.ok) {
          throw new Error('카테고리를 불러오지 못했습니다.');
        }
        const payload = await response.json();
        if (!isMounted) {
          return;
        }
        const raw = Array.isArray(payload) ? payload : [];

        // 🔥 하위 카테고리만 필터링 (parent_type 존재하는 항목)
        const subCategories = raw.filter((item: any) => item.parent_type !== null);

        // 🔥 하위 카테고리 name 배열 만들기
        const names = subCategories
          .map((item: any) => item.name)
          .filter(Boolean);

        // 🔥 셋팅
        setCategoryOptions(names);

        setCategoryError(names.length === 0 ? '카테고리 불러오기 실패' : null);
      } catch (caught) {
        if (!isMounted) {
          return;
        }
        const errorLike = caught as { name?: string } | null;
        if (errorLike?.name === 'AbortError') {
          return;
        }
        console.error('[admin-class] failed to load categories', caught);
        setCategoryOptions([]);
        setCategoryError('카테고리 불러오기 실패');
      } finally {
        if (!isMounted) {
          return;
        }
        setIsCategoryLoading(false);
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const filteredClasses = useMemo(() => {
    const categoryFilter = filters.category.trim();

    return classes.filter((item) => {
      const categoryValue = item.category?.trim() || '';
      return (
        categoryFilter === '전체' ||
        (categoryFilter === '' ? categoryValue === '' : categoryValue === categoryFilter)
      );
    });
  }, [classes, filters]);

  const allDaysSelected = formState.assignmentUploadDays.length === WEEKDAY_OPTIONS.length;

  const resetForm = () => {
    setFormState(createInitialFormState(availableCategories[0] ?? ''));
    setFormError(null);
    setEditingClass(null);
    setIsSaving(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (target: ClassInfo) => {
    setIsSaving(false);
    setEditingClass(target);
    setFormState({
      name: target.name,
      code: target.code || generateClassCode(),
      category: target.category || availableCategories[0] || '',
      startDate: toDateInputValue(target.startDate),
      endDate: toDateInputValue(target.endDate),
      assignmentUploadTime: target.assignmentUploadTime ?? 'all_day',
      assignmentUploadDays: normaliseDays(target.assignmentUploadDays ?? []),
      deliveryMethods: target.deliveryMethods.length > 0 ? target.deliveryMethods : ['영상보기'],
      isActive: target.isActive ?? true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError(null);
    setIsSaving(false);
    setIsLoading(false);
    setEditingClass(null);
  };

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = event.target;

    if (name === 'isActive' && type === 'checkbox') {
      setFormState((prev) => ({ ...prev, isActive: checked }));
      return;
    }

    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeliveryMethodToggle = (method: string) => {
    setFormState((prev) => {
      const exists = prev.deliveryMethods.includes(method);
      if (exists) {
        const remaining = prev.deliveryMethods.filter((item) => item !== method);
        return { ...prev, deliveryMethods: remaining.length > 0 ? remaining : prev.deliveryMethods };
      }
      return { ...prev, deliveryMethods: [...prev.deliveryMethods, method] };
    });
  };

  const handleAssignmentDayToggle = (day: string) => {
    setFormState((prev) => {
      const exists = prev.assignmentUploadDays.includes(day);
      if (exists) {
        const remaining = prev.assignmentUploadDays.filter((item) => item !== day);
        return { ...prev, assignmentUploadDays: remaining };
      }
      return {
        ...prev,
        assignmentUploadDays: normaliseDays([...prev.assignmentUploadDays, day]),
      };
    });
  };

  const handleAllDaysToggle = (checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      assignmentUploadDays: checked ? [...WEEKDAY_OPTIONS] : [],
    }));
  };

  const handleGenerateCode = () => {
    setFormState((prev) => ({ ...prev, code: generateClassCode() }));
  };

  const buildPayload = (): ClassFormPayload => ({
    name: formState.name.trim(),
    code: formState.code.trim(),
    category: formState.category.trim(),
    startDate: formState.startDate ? formState.startDate : null,
    endDate: formState.endDate ? formState.endDate : null,
    assignmentUploadTime: formState.assignmentUploadTime,
    assignmentUploadDays: normaliseDays(formState.assignmentUploadDays),
    deliveryMethods: [...new Set(formState.deliveryMethods.map((item) => item.trim()).filter(Boolean))],
    isActive: formState.isActive,
  });

  const handleSave = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    console.log('🔥 handleSave 실행됨', formState);

    if (isSaving || isLoading) {
      return;
    }

    if (!formState.name.trim()) {
      setFormError('수업명을 입력해주세요.');
      return;
    }
    if (!formState.code.trim()) {
      setFormError('수업 코드를 입력해주세요.');
      return;
    }
    if (formState.deliveryMethods.length === 0) {
      setFormError('수강 방식을 한 가지 이상 선택해주세요.');
      return;
    }
    if (formState.assignmentUploadDays.length === 0) {
      setFormError('과제 업로드 요일을 한 가지 이상 선택해주세요.');
      return;
    }

    setIsSaving(true);
    setIsLoading(true);
    setFormError(null);

    try {
      const payload = buildPayload();
      const result = editingClass
        ? await updateClass(String(editingClass.id), payload)
        : await createClass(payload);

      if (result.success) {
        const successMessage = '저장 완료';
        setFeedbackMessage(successMessage);
        alert(successMessage);
        closeModal();
        resetForm();
        await handleRefresh();
      } else {
        const message = result.message ?? '수업 정보를 저장하지 못했습니다.';
        console.error('[admin-class] failed to save class', message);
        setFormError(message);
        alert(message);
      }
    } catch (caught) {
      console.error('[admin-class] failed to save class', caught);
      const message = caught instanceof Error ? caught.message : '수업 정보를 저장하지 못했습니다.';
      setFormError(message);
      alert(message);
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setFeedbackMessage(null);
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setIsLoading(true);
    try {
      void deleteTarget;
      // const result = await deleteClass(deleteTarget.id);
      // if (result.success) {
      //   setFeedbackMessage(result.message ?? '수업이 삭제되었습니다.');
      //   setDeleteTarget(null);
      // } else {
      //   const message = result.message ?? '수업 삭제에 실패했습니다. 다시 시도해주세요.';
      //   console.error('[admin-class] failed to delete class', message);
      //   alert(message);
      // }
    } catch (caught) {
      void caught;
      // console.error('[admin-class] failed to delete class', caught);
      // const message = caught instanceof Error ? caught.message : '수업 삭제에 실패했습니다. 다시 시도해주세요.';
      // alert(message);
    } finally {
      setIsDeleting(false);
      setIsLoading(false);
    }
  };

const formatAssignmentDays = (days: string[]) => {
  const normalised = normaliseDays(days);
  if (normalised.length === 0) {
    return '-';
  }
  if (normalised.length === WEEKDAY_OPTIONS.length) {
    return '모든 요일';
  }
  if (normalised.join('') === WEEKDAY_OPTIONS.slice(0, 5).join('')) {
    return '월~금';
  }
  return normalised.join(', ');
};

const formatDeliveryMethods = (methods: string[]) => {
  if (methods.length === 0) {
    return '-';
  }
  return methods.join(' · ');
};

const formatAssignmentTime = (value: AssignmentUploadTimeOption | string | undefined) => {
  if (!value) {
    return ASSIGNMENT_UPLOAD_TIME_LABELS.all_day;
  }

  const normalised = typeof value === 'string' ? value.trim().toLowerCase() : value;
  if (normalised === 'same_day' || normalised === 'day_only' || normalised === 'single_day') {
    return ASSIGNMENT_UPLOAD_TIME_LABELS.same_day;
  }

  return ASSIGNMENT_UPLOAD_TIME_LABELS.all_day;
};

const formatDateOnly = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '-';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.replace('T', ' ').match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return trimmed;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '-';
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 16).replace('T', ' ');
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const hh = String(parsed.getHours()).padStart(2, '0');
    const min = String(parsed.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }
  const dateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return `${dateMatch[1]} 00:00`;
  }
  return trimmed;
};

  const statusLabel = (isActive: boolean) => (isActive ? '진행중' : '종료');
  const statusClassName = (isActive: boolean) =>
    isActive ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-500 border border-gray-300';

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#404040]">수업 관리</h2>
            <p className="text-sm text-[#5c5c5c]">수업을 추가, 수정, 삭제하고 과제 업로드 조건을 설정할 수 있습니다.</p>
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
              onClick={openCreateModal}
            >
              + 새 수업 추가
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <label className="flex flex-col text-sm font-semibold text-[#404040] md:col-span-2">
            <span className="mb-2">카테고리</span>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="rounded-xl border border-[#e9dccf] bg-[#fdf7f0] px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
            >
              <option value="전체">전체</option>
              <option value="">카테고리 없음</option>
              {availableCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {feedbackMessage && (
          <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{feedbackMessage}</p>
        )}
        {categoryError && !isCategoryLoading && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{categoryError}</p>
        )}
        {/* 데이터 오류 안내 비활성화 */}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#404040]">수업 목록</h3>
          {isClassListLoading && <span className="text-sm text-[#5c5c5c]">불러오는 중...</span>}
        </div>

        {filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e9dccf] bg-[#fdf7f0]/60 px-6 py-16 text-center text-sm text-[#5c5c5c]">
            <p className="text-base font-semibold text-[#404040]">조건에 맞는 수업이 없습니다.</p>
            <p className="mt-2 text-sm text-[#7a6f68]">필터를 조정하거나 새 수업을 추가해보세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#f0e3d8]">
            <table className="min-w-full divide-y divide-[#f0e3d8] text-sm">
              <thead className="bg-[#fff7d6] text-[#404040]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">수업명</th>
                  <th className="px-4 py-3 text-left font-semibold">수업 코드</th>
                  <th className="px-4 py-3 text-left font-semibold">카테고리</th>
                  <th className="px-4 py-3 text-left font-semibold">시작일</th>
                  <th className="px-4 py-3 text-left font-semibold">종료일</th>
                  <th className="px-4 py-3 text-left font-semibold">과제 업로드 시간</th>
                  <th className="px-4 py-3 text-left font-semibold">과제 업로드 요일</th>
                  <th className="px-4 py-3 text-left font-semibold">수강방식</th>
                  <th className="px-4 py-3 text-left font-semibold">상태</th>
                  <th className="px-4 py-3 text-left font-semibold">생성일</th>
                  <th className="px-4 py-3 text-left font-semibold">수정일</th>
                  <th className="px-4 py-3 text-left font-semibold">수정</th>
                  <th className="px-4 py-3 text-left font-semibold">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e3d8] bg-white">
                {filteredClasses.map((classItem) => (
                  <tr key={classItem.id} className="transition-colors hover:bg-[#fdf7f0]">
                    <td className="px-4 py-3 font-semibold text-[#404040]">{classItem.name}</td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{classItem.code}</td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{classItem.category}</td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{formatDateOnly(classItem.startDate)}</td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{formatDateOnly(classItem.endDate)}</td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{formatAssignmentTime(classItem.assignmentUploadTime)}</td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{formatAssignmentDays(classItem.assignmentUploadDays)}</td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{formatDeliveryMethods(classItem.deliveryMethods)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(classItem.isActive)}`}>
                        {statusLabel(classItem.isActive)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{formatDateTime(classItem.createdAt)}</td>
                    <td className="px-4 py-3 text-[#5c5c5c]">{formatDateTime(classItem.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-full border border-[#e9dccf] px-3 py-1 text-xs font-semibold text-[#404040] transition-colors hover:bg-[#fff5c2]"
                        onClick={() => openEditModal(classItem)}
                      >
                        수정
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                        onClick={() => setDeleteTarget(classItem)}
                      >
                        🗑️ <span>삭제</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-xl">
            <form onSubmit={handleSave} className="flex h-full max-h-[90vh] flex-col">
              <header className="flex items-center justify-between border-b border-[#f0e3d8] px-6 py-4">
                <div>
                  <h3 className="text-xl font-bold text-[#404040]">{editingClass ? '수업 수정' : '새 수업 등록'}</h3>
                  <p className="text-sm text-[#7a6f68]">과제 업로드 조건과 수강 방식을 설정한 후 저장하세요.</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full bg-[#f5eee9] px-3 py-1 text-sm font-semibold text-[#7a6f68] transition-colors hover:bg-[#e9dccf]"
                >
                  ✕ 닫기
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col text-sm font-semibold text-[#404040]">
                    <span className="mb-2">수업명</span>
                    <input
                      name="name"
                      value={formState.name}
                      onChange={handleInputChange}
                      placeholder="예: 캔디마 3기"
                      className="rounded-xl border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                      required
                    />
                  </label>

                  <div className="flex flex-col text-sm font-semibold text-[#404040]">
                    <span className="mb-2">수업 코드</span>
                    <div className="flex gap-2">
                      <input
                        name="code"
                        value={formState.code}
                        onChange={handleInputChange}
                        placeholder="예: CL-2025-ABCD"
                        className="flex-1 rounded-xl border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="rounded-xl border border-[#ffd331] px-3 py-2 text-xs font-semibold text-[#404040] transition-colors hover:bg-[#fff5c2]"
                      >
                        자동 생성
                      </button>
                    </div>
                  </div>

                  <label className="flex flex-col text-sm font-semibold text-[#404040]">
                    <span className="mb-2">카테고리</span>
                    <select
                      name="category"
                      value={formState.category}
                      onChange={handleInputChange}
                      className="rounded-xl border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                    >
                      <option value="">카테고리 없음</option>
                      {availableCategories.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col text-sm font-semibold text-[#404040]">
                      <span className="mb-2">시작일</span>
                      <input
                        type="date"
                        name="startDate"
                        value={formState.startDate}
                        onChange={handleInputChange}
                        className="rounded-xl border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                      />
                    </label>
                    <label className="flex flex-col text-sm font-semibold text-[#404040]">
                      <span className="mb-2">종료일</span>
                      <input
                        type="date"
                        name="endDate"
                        value={formState.endDate}
                        onChange={handleInputChange}
                        className="rounded-xl border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#f0e3d8] bg-[#fdf7f0] p-4">
                    <span className="text-sm font-semibold text-[#404040]">수강 방식</span>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {DELIVERY_METHOD_OPTIONS.map((option) => {
                        const checked = formState.deliveryMethods.includes(option);
                        return (
                          <label
                            key={option}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                              checked
                                ? 'border-[#ffd331] bg-white text-[#404040]'
                                : 'border-[#e9dccf] bg-white text-[#7a6f68] hover:border-[#ffd331]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleDeliveryMethodToggle(option)}
                              className="h-3 w-3"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#f0e3d8] bg-[#fdf7f0] p-4">
                    <label className="flex flex-col text-sm font-semibold text-[#404040]">
                      <span className="mb-2">과제 업로드 가능 시간</span>
                      <select
                        name="assignmentUploadTime"
                        value={formState.assignmentUploadTime}
                        onChange={handleInputChange}
                        className="rounded-xl border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                      >
                        <option value="all_day">24시간 가능 (00:00~23:59)</option>
                        <option value="same_day">하루 한정 (당일 자정~23:59)</option>
                      </select>
                    </label>

                    <div className="mt-4">
                      <span className="text-sm font-semibold text-[#404040]">과제 업로드 가능 요일</span>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label
                          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            allDaysSelected ? 'border-[#ffd331] bg-white text-[#404040]' : 'border-[#e9dccf] bg-white text-[#7a6f68] hover:border-[#ffd331]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={allDaysSelected}
                            onChange={(event) => handleAllDaysToggle(event.target.checked)}
                            className="h-3 w-3"
                          />
                          <span>모든 요일</span>
                        </label>
                        {WEEKDAY_OPTIONS.map((day) => {
                          const checked = formState.assignmentUploadDays.includes(day);
                          return (
                            <label
                              key={day}
                              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                checked
                                  ? 'border-[#ffd331] bg-white text-[#404040]'
                                  : 'border-[#e9dccf] bg-white text-[#7a6f68] hover:border-[#ffd331]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleAssignmentDayToggle(day)}
                                className="h-3 w-3"
                              />
                              <span>{day}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#404040]">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formState.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    <span>진행중 상태로 표시</span>
                  </label>
                </div>

                {formError && (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{formError}</p>
                )}
              </div>

              <footer className="flex items-center justify-end gap-3 border-t border-[#f0e3d8] bg-[#fdf7f0] px-6 py-4">
                <button
                  type="submit"
                  onClick={() => {
                    const wasEditing = Boolean(editingClass);
                    closeModal();
                    if (!wasEditing) {
                      resetForm();
                    }
                  }}
                  className="rounded-full border border-[#e9dccf] px-5 py-2 text-sm font-semibold text-[#7a6f68] transition-colors hover:bg-[#f5eee9]"
                  disabled={isLoading || isSaving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isSaving}
                  className="rounded-full bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
            <h3 className="text-xl font-bold text-[#404040]">수업 삭제</h3>
            <p className="mt-3 text-sm text-[#5c5c5c]">
              정말 이 수업을 삭제하시겠습니까? 삭제된 수업은 복구할 수 없습니다.
            </p>
            <p className="mt-1 text-sm font-semibold text-[#404040]">{deleteTarget.name}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-[#e9dccf] px-5 py-2 text-sm font-semibold text-[#7a6f68] transition-colors hover:bg-[#f5eee9]"
                disabled={isLoading || isDeleting}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full bg-red-500 px-6 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLoading || isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClassManagement;
