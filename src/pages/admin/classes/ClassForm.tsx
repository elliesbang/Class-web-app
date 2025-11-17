import React, { useState } from 'react';

type FormState = {
  name: string;
  code: string;
  category_id: string | number | null;
};

type Props = {
  initialForm?: Partial<FormState>;
  onSubmit: (payload: FormState) => void;
};

const ClassForm: React.FC<Props> = ({ initialForm, onSubmit }) => {
  const [form, setForm] = useState<FormState>({
    name: initialForm?.name ?? '',
    code: initialForm?.code ?? '',
    category_id: initialForm?.category_id ?? null,
  });

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ ...form, category_id: form.category_id });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          이름
          <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          코드
          <input value={form.code} onChange={(e) => handleChange('code', e.target.value)} />
        </label>
      </div>
      <button type="submit">저장</button>
    </form>
  );
};

export default ClassForm;
