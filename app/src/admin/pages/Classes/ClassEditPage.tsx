import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Form from '../../components/Form';
import RuleSelector, { type AssignmentRule } from '../../components/RuleSelector';
import { getClass, updateClass, type ClassPayload } from '../../api/classes';
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

const ClassEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [code, setCode] = useState('');
  const [categories, setCategories] = useState<ClassCategory[]>([]);
  const [rule, setRule] = useState<AssignmentRule>(initialRule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      const [{ data, error: classError }, { data: categoryData, error: categoryError }] = await Promise.all([
        getClass(id),
        getClassCategories(),
      ]);

      if (categoryData) setCategories(categoryData);
      if (categoryError) setError(categoryError.message);

      if (classError) {
        setError(classError.message);
        setLoading(false);
        return;
      }

      if (data) {
        setName(data.name ?? '');
        setDescription(data.description ?? '');
        setCategoryId(data.category_id ? String(data.category_id) : '');
        setCode(data.code ?? '');
        setRule({
          assignment_rule_type: data.assignment_rule_type ?? 'always_open',
          assignment_days: data.assignment_days ?? [],
          assignment_start_time: data.assignment_start_time ?? '',
          assignment_end_time: data.assignment_end_time ?? '',
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    setSaving(true);
    setError(null);

    if (!categoryId) {
      setError('카테고리를 선택해주세요.');
      setSaving(false);
      return;
    }

    const selectedCategory = categories.find((item) => String(item.id) === String(categoryId));

    const payload: ClassPayload = {
      name,
      description,
      category: selectedCategory?.name ?? '',
      category_id: categoryId,
      code,
      assignment_rule_type: rule.assignment_rule_type,
      assignment_days: rule.assignment_days ?? [],
      assignment_start_time: rule.assignment_start_time ?? null,
      assignment_end_time: rule.assignment_end_time ?? null,
    };

    const { error: submitError } = await updateClass(id, payload);
    setSaving(false);

    if (submitError) {
      setError(submitError.message);
      return;
    }

    alert('수업 정보가 수정되었습니다.');
    navigate('/admin/classes');
  };

  if (loading) {
    return <div className="rounded-3xl bg-white p-6 text-sm text-[#6a5c50] shadow-xl shadow-black/5">불러오는 중입니다...</div>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-inner">{error}</div>
      ) : null}

      <Form
        title="수업 수정"
        description="수업 정보와 과제 규칙을 수정하세요."
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
              {saving ? '저장 중...' : '변경사항 저장'}
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

export default ClassEditPage;
