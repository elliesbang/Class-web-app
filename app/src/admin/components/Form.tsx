import type { FormEvent, ReactNode } from 'react';

interface FormProps {
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  actions?: ReactNode;
}

const Form = ({ title, description, children, onSubmit, actions }: FormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
      <div>
        <h3 className="text-lg font-extrabold text-[#3f3a37]">{title}</h3>
        {description ? <p className="mt-1 text-sm text-[#6a5c50]">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
      {actions ? <div className="flex justify-end gap-3 pt-2">{actions}</div> : null}
    </form>
  );
};

export default Form;
