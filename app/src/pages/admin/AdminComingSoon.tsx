type AdminComingSoonProps = {
  title: string;
};

const AdminComingSoon = ({ title }: AdminComingSoonProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-white/80 p-10 text-center shadow-md">
      <h2 className="text-xl font-bold text-[#404040]">{title}</h2>
      <p className="mt-3 text-sm text-[#7a6f68]">준비 중입니다. 곧 만나요!</p>
    </div>
  );
};

export default AdminComingSoon;
