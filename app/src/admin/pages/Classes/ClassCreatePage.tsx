import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Form from '../../components/Form';
import RuleSelector, { type AssignmentRule } from '../../components/RuleSelector';
import { createClass } from '../../api/classes';

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
  const [category, setCategory] = useState('');
  const [code, setCode] = useState('');
  const [rule, setRule] = useState<AssignmentRule>(initialRule);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      description,
      category,
      code,
      assignment_rule_type: rule.assignment_rule_type,
      assignment_days: rule.assignment_days ?? [],
      assignment_start_time: rule.assignment_start_time ?? null,
      assignment_end_time: rule.assignment_end_time ?? null,
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
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
              placeholder="예) 마케팅"
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
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
            placeholder="예) CLASS-001"
          />
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
