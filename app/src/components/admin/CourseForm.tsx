import React, { useState } from 'react';

export default function CourseForm({ onSaved }: { [key: string]: any }) {
  const [form, setForm] = useState<any>({
    name: '',
    code: '',
    category: '',
    duration: '', // ✅ duration 필드 추가
    startDate: '',
    endDate: '',
    assignmentUploadTime: 'all_day',
    assignmentUploadDays: [],
    deliveryMethods: [],
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // const res = await fetch('/.netlify/functions/classes/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(form),
      // });

      // const data = await res.json();
      // if (!data.success) throw new Error(data.message || '수업 저장 실패');

      // alert('✅ 수업이 저장되었습니다!');
      // if (onSaved) {
      //   const record = Array.isArray(data.data) ? data.data[0] : data.data ?? null;
      //   onSaved(record);
      // }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="course-form">
      <div>
        <label>수업명</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} required />
      </div>

      <div>
        <label>코드</label>
        <input type="text" name="code" value={form.code} onChange={handleChange} required />
      </div>

      <div>
        <label>카테고리</label>
        <input type="text" name="category" value={form.category} onChange={handleChange} />
      </div>

      <div>
        <label>수업 기간(duration)</label>
        <input
          type="text"
          name="duration"
          value={form.duration}
          onChange={handleChange}
          placeholder="예: 4주, 8주, 상시 등"
        />
      </div>

      <div>
        <label>시작일</label>
        <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
      </div>

      <div>
        <label>종료일</label>
        <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
      </div>

      <div>
        <label>활성화</label>
        <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '저장 중...' : '저장'}
      </button>

      {/* 데이터 오류 안내 비활성화 */}
    </form>
  );
}
