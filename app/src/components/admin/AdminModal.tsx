import type { ReactNode } from 'react';

export type AdminModalProps = {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

const AdminModal = ({ title, subtitle, onClose, children, footer, className }: AdminModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className={`w-full max-w-3xl transform rounded-2xl bg-white p-6 shadow-xl transition-all duration-200 ease-in-out ${
          className ?? ''
        }`}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            {title ? <h2 className="text-lg font-bold text-[#404040]">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-[#7a6f68]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5eee9] text-lg text-[#404040] transition hover:bg-[#ffd331]/70"
            onClick={onClose}
            aria-label="모달 닫기"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] overflow-y-auto text-[#404040]">{children}</div>

        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
};

export default AdminModal;
