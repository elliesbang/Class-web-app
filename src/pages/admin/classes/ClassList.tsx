import React from 'react';

type ClassRow = {
  id: number;
  name: string;
  code: string;
};

type Props = {
  rows: ClassRow[];
  authUser?: { role?: string } | null;
  handleDelete: (id: number) => void;
};

const ClassList: React.FC<Props> = ({ rows, authUser, handleDelete }) => {
  const canDelete = authUser?.role === 'admin';

  return (
    <table>
      <thead>
        <tr>
          <th>이름</th>
          <th>코드</th>
          <th>액션</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.code}</td>
            <td>
              <button disabled={!canDelete} onClick={() => handleDelete(row.id)}>
                삭제
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ClassList;
