import React from 'react';

type CertificateDownloadProps = {
  completed: boolean;
  certificateUrl?: string;
};

const CertificateDownload = ({ completed, certificateUrl }: CertificateDownloadProps) => {
  if (!completed) return null;

  return (
    <div className="rounded-2xl bg-white/70 px-5 py-4 shadow-soft flex flex-col gap-2">
      <p className="text-sm font-semibold text-ellieGray">🎉 모든 회차를 완료했어요! 수료증을 다운로드하세요.</p>
      {certificateUrl ? (
        <a
          href={certificateUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-[#ffd331] rounded-2xl px-4 py-2 font-semibold text-ellieGray text-center shadow-soft"
        >
          수료증 다운로드
        </a>
      ) : (
        <p className="text-xs text-ellieGray/70">수료증을 생성 중입니다...</p>
      )}
    </div>
  );
};

export default CertificateDownload;
