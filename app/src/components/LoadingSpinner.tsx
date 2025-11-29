import React from 'react';

const LoadingSpinner = ({ text = '로딩 중...' }: { text?: string }) => {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ellieGray">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-ellieYellow border-t-transparent" aria-hidden />
      {text ? <p className="text-sm font-medium">{text}</p> : null}
    </div>
  );
};

export default LoadingSpinner;
