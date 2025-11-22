import { useState } from 'react';

import StudentTab from '../../students/tabs/StudentTab';
import VodTab from '../../students/tabs/VodTab';

const StudentsPage = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'vod'>('student');

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c18f1f]">Students</p>
        <h2 className="text-xl font-black text-[#3f3a37]">수강생 관리</h2>
        <p className="text-sm text-[#6a5c50]">실강/챌린지 수강생과 VOD 구매자를 구분해서 확인하세요.</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-inner transition ${
              activeTab === 'student' ? 'bg-[#ffd331] text-[#3f3a37]' : 'bg-[#fff7d6] text-[#5c5246] hover:bg-[#ffe8a3]'
            }`}
          >
            수강생
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vod')}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-inner transition ${
              activeTab === 'vod' ? 'bg-[#ffd331] text-[#3f3a37]' : 'bg-[#fff7d6] text-[#5c5246] hover:bg-[#ffe8a3]'
            }`}
          >
            VOD
          </button>
        </div>
      </div>

      {activeTab === 'student' ? <StudentTab /> : <VodTab />}
    </div>
  );
};

export default StudentsPage;
