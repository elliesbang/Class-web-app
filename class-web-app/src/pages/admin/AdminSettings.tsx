import { ChangeEvent, FormEvent, useState } from 'react';

type UploadFormat = 'image' | 'pdf' | 'link';
type SubmissionLimit = 'daily' | 'unlimited' | 'perSession';

type BrandSettings = {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  domain: string;
  logoMode: 'upload' | 'url';
  logoFileName: string | null;
  logoUrl: string;
};

type GlobalUploadPolicy = {
  allowedFormats: UploadFormat[];
  maxFileSize: number;
  uploadStart: string;
  uploadEnd: string;
  autoReset: boolean;
};

type ClassUploadPolicy = {
  classType: string;
  allowedFormats: UploadFormat[];
  maxFileSize: number;
  uploadStart: string;
  uploadEnd: string;
  submissionLimit: SubmissionLimit;
  autoInherit: boolean;
};

type AdminAccount = {
  id: number;
  name: string;
  email: string;
  role: '관리자' | '부관리자' | '강사';
};

type BoardPolicy = {
  pinNotice: boolean;
  allowComments: boolean;
  displayMode: 'all' | 'selected';
  selectedClasses: string[];
};

type DataManagementState = {
  isBackingUp: boolean;
  isResetting: boolean;
  isExporting: boolean;
};

const classTypes = ['미치나', '캔디마', '캔디수', '디캘드로', '나캔디'];

const uploadFormatOptions: { label: string; value: UploadFormat }[] = [
  { label: '이미지', value: 'image' },
  { label: 'PDF', value: 'pdf' },
  { label: '링크', value: 'link' },
];

const roleBadgeColor: Record<AdminAccount['role'], string> = {
  관리자: 'bg-yellow-200 text-yellow-800',
  부관리자: 'bg-emerald-200 text-emerald-800',
  강사: 'bg-blue-200 text-blue-800',
};

const uploadFormatLabel: Record<UploadFormat, string> = {
  image: '이미지',
  pdf: 'PDF',
  link: '링크',
};

const submissionLimitLabels: Record<SubmissionLimit, string> = {
  daily: '1일 1회',
  unlimited: '자유',
  perSession: '회차별',
};

const AdminSettings = () => {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    brandName: '엘리의방',
    primaryColor: '#ffd331',
    secondaryColor: '#f5eee9',
    timezone: 'Asia/Seoul',
    domain: 'https://elliesbang.com',
    logoMode: 'upload',
    logoFileName: null,
    logoUrl: '',
  });

  const [globalPolicy, setGlobalPolicy] = useState<GlobalUploadPolicy>({
    allowedFormats: ['image', 'pdf', 'link'],
    maxFileSize: 20,
    uploadStart: '00:00',
    uploadEnd: '23:59',
    autoReset: true,
  });

  const [classPolicies, setClassPolicies] = useState<ClassUploadPolicy[]>([
    {
      classType: '미치나',
      allowedFormats: ['image'],
      maxFileSize: 15,
      uploadStart: '00:00',
      uploadEnd: '23:59',
      submissionLimit: 'daily',
      autoInherit: true,
    },
    {
      classType: '캔디마',
      allowedFormats: ['pdf', 'link'],
      maxFileSize: 25,
      uploadStart: '09:00',
      uploadEnd: '22:00',
      submissionLimit: 'perSession',
      autoInherit: true,
    },
  ]);

  const [selectedClassType, setSelectedClassType] = useState<string>(classTypes[0]);
  const [classPolicyForm, setClassPolicyForm] = useState<ClassUploadPolicy>(() => {
    const existing = classPolicies.find((policy) => policy.classType === classTypes[0]);
    if (existing) {
      return { ...existing };
    }
    return {
      classType: classTypes[0],
      allowedFormats: globalPolicy.allowedFormats,
      maxFileSize: globalPolicy.maxFileSize,
      uploadStart: globalPolicy.uploadStart,
      uploadEnd: globalPolicy.uploadEnd,
      submissionLimit: 'unlimited',
      autoInherit: true,
    };
  });

  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([
    { id: 1, name: '김엘리', email: 'admin@elliesbang.com', role: '관리자' },
    { id: 2, name: '박지원', email: 'support@elliesbang.com', role: '부관리자' },
    { id: 3, name: '송하늘', email: 'teacher@elliesbang.com', role: '강사' },
  ]);

  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '관리자' as AdminAccount['role'],
  });

  const [authSettings, setAuthSettings] = useState({
    authType: 'email',
    sessionTimeout: '1h',
  });

  const [boardPolicy, setBoardPolicy] = useState<BoardPolicy>({
    pinNotice: true,
    allowComments: false,
    displayMode: 'all',
    selectedClasses: [],
  });

  const [dataState, setDataState] = useState<DataManagementState>({
    isBackingUp: false,
    isResetting: false,
    isExporting: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleBrandInputChange = (field: keyof BrandSettings, value: string) => {
    setBrandSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setBrandSettings((prev) => ({ ...prev, logoFileName: null }));
      return;
    }
    setBrandSettings((prev) => ({ ...prev, logoFileName: file.name }));
  };

  const toggleAllowedFormat = (value: UploadFormat) => {
    setGlobalPolicy((prev) => {
      const isSelected = prev.allowedFormats.includes(value);
      return {
        ...prev,
        allowedFormats: isSelected
          ? prev.allowedFormats.filter((format) => format !== value)
          : [...prev.allowedFormats, value],
      };
    });
  };

  const updateClassPolicyForm = (updates: Partial<ClassUploadPolicy>) => {
    setClassPolicyForm((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleSelectClassType = (classType: string) => {
    setSelectedClassType(classType);
    const existing = classPolicies.find((policy) => policy.classType === classType);
    if (existing) {
      setClassPolicyForm({ ...existing });
    } else {
      setClassPolicyForm({
        classType,
        allowedFormats: globalPolicy.allowedFormats,
        maxFileSize: globalPolicy.maxFileSize,
        uploadStart: globalPolicy.uploadStart,
        uploadEnd: globalPolicy.uploadEnd,
        submissionLimit: 'unlimited',
        autoInherit: true,
      });
    }
  };

  const handleClassPolicySave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClassPolicies((prev) => {
      const exists = prev.some((policy) => policy.classType === classPolicyForm.classType);
      if (exists) {
        return prev.map((policy) =>
          policy.classType === classPolicyForm.classType ? { ...classPolicyForm } : policy,
        );
      }
      return [...prev, { ...classPolicyForm }];
    });
    setToastMessage(`${classPolicyForm.classType} 제출 정책이 저장되었습니다.`);
  };

  const resetClassPolicyToGlobal = () => {
    setClassPolicyForm((prev) => ({
      ...prev,
      allowedFormats: globalPolicy.allowedFormats,
      maxFileSize: globalPolicy.maxFileSize,
      uploadStart: globalPolicy.uploadStart,
      uploadEnd: globalPolicy.uploadEnd,
      submissionLimit: 'unlimited',
    }));
    setToastMessage(`${classPolicyForm.classType} 정책이 전역 기본값으로 초기화되었습니다.`);
  };

  const handleAddAdminAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountForm.name || !accountForm.email || !accountForm.password) {
      setToastMessage('계정 정보를 모두 입력해주세요.');
      return;
    }

    setAdminAccounts((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: accountForm.name,
        email: accountForm.email,
        role: accountForm.role,
      },
    ]);

    setAccountForm({ name: '', email: '', password: '', role: '관리자' });
    setToastMessage('새 관리자 계정을 추가했습니다.');
  };

  const removeAdminAccount = (id: number) => {
    setAdminAccounts((prev) => prev.filter((account) => account.id !== id));
    setToastMessage('관리자 계정을 삭제했습니다.');
  };

  const handleSaveAll = () => {
    setToastMessage('설정이 저장되었습니다. 실제 API 연동 시 서버로 전송하세요.');
  };

  const handleBackup = () => {
    setDataState((prev) => ({ ...prev, isBackingUp: true }));
    setTimeout(() => {
      setDataState((prev) => ({ ...prev, isBackingUp: false }));
      setToastMessage('전체 백업 파일이 생성되었습니다.');
    }, 900);
  };

  const handleExportCsv = () => {
    setDataState((prev) => ({ ...prev, isExporting: true }));
    setTimeout(() => {
      setDataState((prev) => ({ ...prev, isExporting: false }));
      setToastMessage('CSV 파일을 준비했습니다. 다운로드를 시작하세요.');
    }, 900);
  };

  const handleResetAll = () => {
    const confirmed = window.confirm('⚠️ 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
    if (!confirmed) {
      return;
    }
    setDataState((prev) => ({ ...prev, isResetting: true }));
    setTimeout(() => {
      setDataState((prev) => ({ ...prev, isResetting: false }));
      setToastMessage('데이터를 초기화했습니다. 실제 삭제 연동은 API 연결 후 진행하세요.');
    }, 900);
  };

  const handleToastClose = () => setToastMessage(null);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl bg-white/90 p-4 shadow-md backdrop-blur">
        <div>
          <h2 className="text-lg font-semibold text-[#404040]">⚙️ 설정</h2>
          <p className="text-sm text-[#6b6b6b]">전역 기본값과 수업별 정책을 한 곳에서 관리하세요.</p>
        </div>
        <button
          type="button"
          onClick={handleSaveAll}
          className="rounded-full bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow transition hover:bg-yellow-400"
        >
          전체 저장
        </button>
      </div>

      {toastMessage && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span>{toastMessage}</span>
            <button type="button" onClick={handleToastClose} className="text-xs font-semibold underline">
              닫기
            </button>
          </div>
        </div>
      )}

      <section className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-[#404040]">1️⃣ 시스템 기본 설정</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#404040]">브랜드명</label>
              <input
                type="text"
                value={brandSettings.brandName}
                onChange={(event) => handleBrandInputChange('brandName', event.target.value)}
                className="w-full rounded-lg border border-[#e9dccf] bg-white px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#404040]">메인 컬러</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandSettings.primaryColor}
                    onChange={(event) => handleBrandInputChange('primaryColor', event.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-[#e9dccf]"
                  />
                  <span className="rounded-lg border border-[#e9dccf] px-3 py-2 text-sm text-[#404040]">
                    {brandSettings.primaryColor.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#404040]">서브 컬러</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandSettings.secondaryColor}
                    onChange={(event) => handleBrandInputChange('secondaryColor', event.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-[#e9dccf]"
                  />
                  <span className="rounded-lg border border-[#e9dccf] px-3 py-2 text-sm text-[#404040]">
                    {brandSettings.secondaryColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#404040]">타임존</label>
              <input
                type="text"
                value={brandSettings.timezone}
                onChange={(event) => handleBrandInputChange('timezone', event.target.value)}
                className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#404040]">도메인 주소</label>
              <input
                type="url"
                value={brandSettings.domain}
                onChange={(event) => handleBrandInputChange('domain', event.target.value)}
                className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="mb-2 block text-sm font-medium text-[#404040]">로고 업로드</span>
              <div className="mb-3 flex gap-3 text-sm">
                <label className="flex items-center gap-2 text-[#404040]">
                  <input
                    type="radio"
                    name="logoMode"
                    value="upload"
                    checked={brandSettings.logoMode === 'upload'}
                    onChange={(event) => handleBrandInputChange('logoMode', event.target.value)}
                  />
                  PNG 업로드
                </label>
                <label className="flex items-center gap-2 text-[#404040]">
                  <input
                    type="radio"
                    name="logoMode"
                    value="url"
                    checked={brandSettings.logoMode === 'url'}
                    onChange={(event) => handleBrandInputChange('logoMode', event.target.value)}
                  />
                  URL 입력
                </label>
              </div>
              {brandSettings.logoMode === 'upload' ? (
                <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e9dccf] px-4 py-10 text-center text-sm text-[#6b6b6b] hover:border-[#ffd331]">
                  <input type="file" accept="image/png" className="hidden" onChange={handleLogoFileChange} />
                  <span className="text-3xl">📁</span>
                  <span>PNG 파일을 업로드하세요</span>
                  {brandSettings.logoFileName && <span className="font-semibold text-[#404040]">{brandSettings.logoFileName}</span>}
                </label>
              ) : (
                <input
                  type="url"
                  placeholder="https://..."
                  value={brandSettings.logoUrl}
                  onChange={(event) => handleBrandInputChange('logoUrl', event.target.value)}
                  className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                />
              )}
            </div>
            <div className="rounded-xl border border-[#f0e6db] bg-[#fff9ed] p-4 text-sm text-[#6b6b6b]">
              <p className="font-semibold text-[#404040]">브랜드 미리보기</p>
              <div className="mt-3 flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-xl border border-white shadow-md"
                  style={{ backgroundColor: brandSettings.primaryColor }}
                />
                <div className="space-y-1">
                  <div className="rounded-md bg-white/70 px-3 py-1 text-sm font-semibold text-[#404040]">
                    {brandSettings.brandName}
                  </div>
                  <div className="text-xs text-[#6b6b6b]">{brandSettings.domain}</div>
                  <div className="text-xs text-[#6b6b6b]">Timezone: {brandSettings.timezone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-[#404040]">2️⃣ 운영 정책 설정 (전역 기본값)</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-[#404040]">허용 형식</p>
            <div className="flex flex-wrap gap-3">
              {uploadFormatOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                    globalPolicy.allowedFormats.includes(option.value)
                      ? 'border-[#ffd331] bg-[#fff6d1] text-[#404040]'
                      : 'border-[#e9dccf] text-[#6b6b6b]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={globalPolicy.allowedFormats.includes(option.value)}
                    onChange={() => toggleAllowedFormat(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#404040]">업로드 용량 제한 (MB)</label>
              <input
                type="number"
                min={1}
                value={globalPolicy.maxFileSize}
                onChange={(event) =>
                  setGlobalPolicy((prev) => ({ ...prev, maxFileSize: Number(event.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#404040]">자동 초기화</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6b6b6b]">기수 종료 시 과제+피드백 삭제</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={globalPolicy.autoReset}
                    onChange={(event) => setGlobalPolicy((prev) => ({ ...prev, autoReset: event.target.checked }))}
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-yellow-400" />
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                </label>
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[#404040]">제출 가능 시간대</label>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#404040]">
              <span>시작</span>
              <input
                type="time"
                value={globalPolicy.uploadStart}
                onChange={(event) => setGlobalPolicy((prev) => ({ ...prev, uploadStart: event.target.value }))}
                className="rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
              />
              <span>~ 종료</span>
              <input
                type="time"
                value={globalPolicy.uploadEnd}
                onChange={(event) => setGlobalPolicy((prev) => ({ ...prev, uploadEnd: event.target.value }))}
                className="rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
              />
              <span className="text-xs text-[#6b6b6b]">수업별 정책 미설정 시 자동 적용</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-md">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-[#404040]">3️⃣ 수업별 업로드 정책 (Class Type 기준)</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-[#6b6b6b]">수업 종류 선택</span>
            <select
              value={selectedClassType}
              onChange={(event) => handleSelectClassType(event.target.value)}
              className="rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
            >
              {classTypes.map((classType) => (
                <option key={classType} value={classType}>
                  {classType}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleClassPolicySave} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-[#404040]">허용 형식</p>
              <div className="flex flex-wrap gap-3">
                {uploadFormatOptions.map((option) => {
                  const isChecked = classPolicyForm.allowedFormats.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                        isChecked ? 'border-[#ffd331] bg-[#fff6d1] text-[#404040]' : 'border-[#e9dccf] text-[#6b6b6b]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          updateClassPolicyForm({
                            allowedFormats: isChecked
                              ? classPolicyForm.allowedFormats.filter((format) => format !== option.value)
                              : [...classPolicyForm.allowedFormats, option.value],
                          });
                        }}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#404040]">업로드 용량 제한 (MB)</label>
                <input
                  type="number"
                  min={1}
                  value={classPolicyForm.maxFileSize}
                  onChange={(event) =>
                    updateClassPolicyForm({ maxFileSize: Number(event.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#404040]">업로드 횟수 제한</label>
                <select
                  value={classPolicyForm.submissionLimit}
                  onChange={(event) =>
                    updateClassPolicyForm({ submissionLimit: event.target.value as SubmissionLimit })
                  }
                  className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                >
                  <option value="daily">1일 1회</option>
                  <option value="unlimited">자유</option>
                  <option value="perSession">회차별</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#404040]">새 기수 자동 상속</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={classPolicyForm.autoInherit}
                  onChange={(event) => updateClassPolicyForm({ autoInherit: event.target.checked })}
                />
                <div className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-yellow-400" />
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#404040]">제출 가능 시간대</label>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#404040]">
                <span>시작</span>
                <input
                  type="time"
                  value={classPolicyForm.uploadStart}
                  onChange={(event) => updateClassPolicyForm({ uploadStart: event.target.value })}
                  className="rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
                />
                <span>~ 종료</span>
                <input
                  type="time"
                  value={classPolicyForm.uploadEnd}
                  onChange={(event) => updateClassPolicyForm({ uploadEnd: event.target.value })}
                  className="rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
                />
              </div>
            </div>

              <div className="rounded-xl border border-[#f0e6db] bg-[#fff9ed] p-4 text-sm text-[#6b6b6b]">
              <p className="font-semibold text-[#404040]">현재 정책 요약</p>
              <div className="mt-3 space-y-2 text-xs text-[#5c5c5c]">
                <div className="flex justify-between">
                  <span>허용 형식</span>
                  <span>
                    {classPolicyForm.allowedFormats
                      .map((format) => uploadFormatLabel[format])
                      .join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>용량 제한</span>
                  <span>{classPolicyForm.maxFileSize}MB</span>
                </div>
                <div className="flex justify-between">
                  <span>제출 시간</span>
                  <span>
                    {classPolicyForm.uploadStart} ~ {classPolicyForm.uploadEnd}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>횟수 제한</span>
                  <span>{submissionLimitLabels[classPolicyForm.submissionLimit]}</span>
                </div>
                <div className="flex justify-between">
                  <span>자동 상속</span>
                  <span>{classPolicyForm.autoInherit ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-[#ffd331] px-5 py-2 text-sm font-semibold text-[#404040] shadow hover:bg-yellow-400"
              >
                저장
              </button>
              <button
                type="button"
                onClick={resetClassPolicyToGlobal}
                className="rounded-full border border-[#e9dccf] px-5 py-2 text-sm font-semibold text-[#6b6b6b] transition hover:border-[#ffd331] hover:text-[#404040]"
              >
                전역 기본값으로 초기화
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8">
          <h4 className="mb-3 text-sm font-semibold text-[#404040]">수업별 저장된 정책</h4>
          <div className="grid gap-4 md:grid-cols-2">
            {classPolicies.map((policy) => (
              <div key={policy.classType} className="rounded-xl border border-[#f0e6db] bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#404040]">{policy.classType}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#6b6b6b] underline"
                    onClick={() => handleSelectClassType(policy.classType)}
                  >
                    편집
                  </button>
                </div>
                <ul className="space-y-1 text-xs text-[#6b6b6b]">
                  <li>
                    허용 형식:{' '}
                    {policy.allowedFormats
                      .map((format) => uploadFormatLabel[format])
                      .join(', ')}
                  </li>
                  <li>용량 제한: {policy.maxFileSize}MB</li>
                  <li>
                    제출 시간: {policy.uploadStart} ~ {policy.uploadEnd}
                  </li>
                  <li>횟수 제한: {submissionLimitLabels[policy.submissionLimit]}</li>
                  <li>새 기수 자동 상속: {policy.autoInherit ? 'ON' : 'OFF'}</li>
                </ul>
              </div>
            ))}
            {classPolicies.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#e9dccf] p-6 text-center text-sm text-[#6b6b6b]">
                아직 저장된 정책이 없습니다. 수업 종류를 선택한 후 정책을 저장하세요.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-[#404040]">4️⃣ 계정 및 접근 설정</h3>
        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleAddAdminAccount} className="space-y-4 rounded-xl border border-[#f0e6db] bg-[#fffdf6] p-4">
            <h4 className="text-sm font-semibold text-[#404040]">관리자 계정 추가</h4>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block text-[#404040]">이름</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(event) => setAccountForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[#404040]">이메일</label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(event) => setAccountForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[#404040]">임시 비밀번호</label>
                <input
                  type="password"
                  value={accountForm.password}
                  onChange={(event) => setAccountForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[#404040]">권한 수준</label>
                <select
                  value={accountForm.role}
                  onChange={(event) =>
                    setAccountForm((prev) => ({ ...prev, role: event.target.value as AdminAccount['role'] }))
                  }
                  className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
                >
                  <option value="관리자">관리자</option>
                  <option value="부관리자">부관리자</option>
                  <option value="강사">강사</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-[#ffd331] py-2 text-sm font-semibold text-[#404040] shadow hover:bg-yellow-400"
            >
              계정 등록
            </button>
          </form>

          <div className="space-y-4 rounded-xl border border-[#f0e6db] bg-[#fffdf6] p-4">
            <h4 className="text-sm font-semibold text-[#404040]">로그인 및 세션</h4>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block text-[#404040]">로그인 방식</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-[#404040]">
                    <input
                      type="radio"
                      name="authType"
                      value="email"
                      checked={authSettings.authType === 'email'}
                      onChange={(event) => setAuthSettings((prev) => ({ ...prev, authType: event.target.value }))}
                    />
                    이메일 로그인
                  </label>
                  <label className="flex items-center gap-2 text-[#404040]">
                    <input
                      type="radio"
                      name="authType"
                      value="michina"
                      checked={authSettings.authType === 'michina'}
                      onChange={(event) => setAuthSettings((prev) => ({ ...prev, authType: event.target.value }))}
                    />
                    미치나 인증
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[#404040]">자동 로그아웃 시간</label>
                <select
                  value={authSettings.sessionTimeout}
                  onChange={(event) => setAuthSettings((prev) => ({ ...prev, sessionTimeout: event.target.value }))}
                  className="w-full rounded-lg border border-[#e9dccf] px-3 py-2 focus:border-[#ffd331] focus:outline-none"
                >
                  <option value="30m">30분</option>
                  <option value="1h">1시간</option>
                  <option value="3h">3시간</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-[#f0e6db] bg-white p-4">
            <h4 className="text-sm font-semibold text-[#404040]">관리자 목록</h4>
            <div className="space-y-3 text-sm">
              {adminAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#f0e6db] px-3 py-2">
                  <div>
                    <p className="font-semibold text-[#404040]">{account.name}</p>
                    <p className="text-xs text-[#6b6b6b]">{account.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadgeColor[account.role]}`}>
                      {account.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAdminAccount(account.id)}
                      className="text-xs font-semibold text-red-500 hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-[#404040]">5️⃣ 공지 및 게시판 정책</h3>
        <div className="space-y-6 text-sm text-[#404040]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">공지 자동 고정</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={boardPolicy.pinNotice}
                onChange={(event) => setBoardPolicy((prev) => ({ ...prev, pinNotice: event.target.checked }))}
              />
              <div className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-yellow-400" />
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">댓글 허용 여부</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="boardComments"
                  value="allow"
                  checked={boardPolicy.allowComments === true}
                  onChange={() => setBoardPolicy((prev) => ({ ...prev, allowComments: true }))}
                />
                허용
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="boardComments"
                  value="deny"
                  checked={boardPolicy.allowComments === false}
                  onChange={() => setBoardPolicy((prev) => ({ ...prev, allowComments: false }))}
                />
                비허용
              </label>
            </div>
          </div>
          <div>
            <span className="mb-2 block font-medium">강의실 공지 노출</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="boardDisplay"
                  value="all"
                  checked={boardPolicy.displayMode === 'all'}
                  onChange={() => setBoardPolicy((prev) => ({ ...prev, displayMode: 'all', selectedClasses: [] }))}
                />
                모든 수업 상단에 표시
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="boardDisplay"
                  value="selected"
                  checked={boardPolicy.displayMode === 'selected'}
                  onChange={() => setBoardPolicy((prev) => ({ ...prev, displayMode: 'selected' }))}
                />
                <span>
                  선택 수업만 표시
                  {boardPolicy.displayMode === 'selected' && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#6b6b6b]">
                      {classTypes.map((classType) => {
                        const isSelected = boardPolicy.selectedClasses.includes(classType);
                        return (
                          <label
                            key={classType}
                            className={`flex items-center gap-1 rounded-full border px-2 py-1 ${
                              isSelected ? 'border-[#ffd331] bg-[#fff6d1] text-[#404040]' : 'border-[#e9dccf]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setBoardPolicy((prev) => ({
                                  ...prev,
                                  selectedClasses: isSelected
                                    ? prev.selectedClasses.filter((item) => item !== classType)
                                    : [...prev.selectedClasses, classType],
                                }));
                              }}
                            />
                            {classType}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </span>
              </label>
            </div>
          </div>
          <p className="rounded-lg bg-[#fff9ed] px-4 py-3 text-xs text-[#6b6b6b]">
            개별 공지 업로드는 ‘게시판 관리’ 메뉴에서 처리하고, 이곳에서는 전체 정책만 관리합니다.
          </p>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-[#404040]">6️⃣ 데이터 관리</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={handleBackup}
            className="rounded-xl border border-[#f0e6db] bg-white p-6 text-center text-sm font-semibold text-[#404040] shadow transition hover:border-[#ffd331]"
            disabled={dataState.isBackingUp}
          >
            <span className="text-3xl">💾</span>
            <div className="mt-2">전체 백업</div>
            <div className="mt-1 text-xs text-[#6b6b6b]">
              {dataState.isBackingUp ? '백업 준비 중...' : '과제, 피드백, 수강생 데이터를 zip으로 생성'}
            </div>
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-600 shadow transition hover:bg-red-100"
            disabled={dataState.isResetting}
          >
            <span className="text-3xl">⚠️</span>
            <div className="mt-2">전체 초기화</div>
            <div className="mt-1 text-xs text-red-500">
              {dataState.isResetting ? '삭제 작업 진행 중...' : '모든 데이터 삭제 (확인 모달 필수)'}
            </div>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-xl border border-[#f0e6db] bg-white p-6 text-center text-sm font-semibold text-[#404040] shadow transition hover:border-[#ffd331]"
            disabled={dataState.isExporting}
          >
            <span className="text-3xl">📤</span>
            <div className="mt-2">CSV 내보내기</div>
            <div className="mt-1 text-xs text-[#6b6b6b]">
              {dataState.isExporting ? '내보내기 준비 중...' : '수강생 / 과제 / 피드백 데이터를 다운로드'}
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
