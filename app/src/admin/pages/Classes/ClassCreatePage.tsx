import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Form from '../../components/Form';
import RuleSelector, { type AssignmentRule } from '../../components/RuleSelector';
import { createClass } from '../../api/classes';
import { getClassCategories } from '../../../lib/api/classroom';

interface ClassCategory {
  id: number | string;
  name: string;
}

const initialRule: AssignmentRule = {
  assignment_rule_type: 'always_open',
  assignment_days: [],
  assignment_start_time: '',
  assignment_end_time: '',
};

const ClassCreatePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState<ClassCategory[]>([]);
  const [rule, setRule] = useState<AssignmentRule>(initialRule);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error: fetchError } = await getClassCategories();
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setCategories(data ?? []);
      }
    };

    fetchCategories();
  }, []);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let r = '';
    for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
    setCode(`CL-${r}`);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (!categoryId) {
      setError('카테고리를 선택해주세요.');
      setSaving(false);
      return;
    }

    const selectedCategory = categories.find((item) => String(item.id) === String(categoryId));

    const payload = {
      name,
      description,
      category: selectedCategory?.name ?? '',
      category_id: categoryId,
      code,
      assignment_rule_type: rule.assignment_rule_type,
      assignment_days: rule.assignment_days ?? [],
      assignment_start_time: rule.assignment_start_time ?? null,
      assignment_end_time: rule.assignment_end_time ?? null,
      start_date: startDate || null,
      end_date: endDate || null,
    };

    const { error: submitError } = await createClass(payload);
    setSaving(false);

    if (submitError) {
      setError(submitError.message);
      return;
    }

    alert('수업이 생성되었습니다.');
    navigate('/admin/classes');
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-inner">{error}</div>
      ) : null}

      <Form
        title="새 수업 생성"
        description="수업 정보와 과제 규칙을 설정하세요."
        onSubmit={handleSubmit}
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/admin/classes')}
              className="rounded-full bg-[#fff7d6] px-4 py-2 text-sm font-semibold text-[#3f3a37] shadow-inner hover:bg-[#ffe8a3]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#ffd331] px-5 py-2 text-sm font-semibold text-[#3f3a37] shadow-md transition hover:bg-[#f3c623] disabled:opacity-60"
            >
              {saving ? '저장 중...' : '수업 생성'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#3f3a37]">수업명</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
              placeholder="예) 마케팅 입문"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#3f3a37]">카테고리</span>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#3f3a37]">시작일</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#3f3a37]">종료일</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#3f3a37]">설명</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
            rows={3}
            placeholder="수업에 대한 짧은 설명을 입력하세요."
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#3f3a37]">수업 코드</span>
          <div className="flex items-center gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
              placeholder="예) CL-XXXXXX"
            />
            <button
              type="button"
              onClick={generateRandomCode}
              className="whitespace-nowrap rounded-full bg-[#fff7d6] px-3 py-2 text-xs font-semibold text-[#3f3a37] shadow-inner hover:bg-[#ffe8a3]"
            >
              랜덤 생성
            </button>
          </div>
        </label>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-[#3f3a37]">과제 규칙 설정</span>
          <RuleSelector value={rule} onChange={setRule} />
        </div>
      </Form>
    </div>
  );
};

export default ClassCreatePage;
