import type { ReactNode } from 'react';

interface TableProps {
  title?: string;
  description?: string;
  headers: string[];
  children: ReactNode;
}

const Table = ({ title, description, headers, children }: TableProps) => {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
      {title ? <h3 className="text-lg font-extrabold text-[#3f3a37]">{title}</h3> : null}
      {description ? <p className="mt-1 text-sm text-[#6a5c50]">{description}</p> : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#f1e4c2]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f1e4c2] text-sm text-[#3f3a37]">
            <thead className="bg-[#fff7d6] text-left text-xs font-semibold uppercase tracking-wide text-[#5c5246]">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1e4c2] bg-white">{children}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Table;
