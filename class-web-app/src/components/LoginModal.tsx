import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

const panelVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" }
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2, ease: "easeIn" } }
};

type ActiveForm = "buttons" | "student" | "admin";

const LoginModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<ActiveForm>("buttons");

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setActiveForm("buttons");
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal, isOpen]);

  const renderButtons = () => (
    <motion.div
      key="login-options"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-3"
    >
      <button
        type="button"
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 mt-4 w-full transition-colors"
        onClick={() => setActiveForm("student")}
      >
        수강생 로그인
      </button>
      <button
        type="button"
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full transition-colors"
        onClick={() => setActiveForm("admin")}
      >
        관리자 로그인
      </button>
    </motion.div>
  );

  const renderBackButton = () => (
    <button
      type="button"
      className="absolute right-0 top-0 text-sm text-gray-500 hover:text-gray-700"
      onClick={() => setActiveForm("buttons")}
    >
      ← 뒤로가기
    </button>
  );

  const renderStudentForm = () => (
    <motion.div
      key="student-form"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
    >
      {renderBackButton()}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="student-name">
          이름
        </label>
        <input
          id="student-name"
          type="text"
          className="border border-gray-300 rounded-md w-full p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="이름을 입력하세요"
        />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="student-email">
          이메일
        </label>
        <input
          id="student-email"
          type="email"
          className="border border-gray-300 rounded-md w-full p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="이메일을 입력하세요"
        />
        <button
          type="button"
          className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full transition-colors"
        >
          로그인
        </button>
      </div>
    </motion.div>
  );

  const renderAdminForm = () => (
    <motion.div
      key="admin-form"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
    >
      {renderBackButton()}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="admin-password">
          관리자 비밀번호
        </label>
        <input
          id="admin-password"
          type="password"
          className="border border-gray-300 rounded-md w-full p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="비밀번호를 입력하세요"
        />
        <button
          type="button"
          className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full transition-colors"
        >
          로그인
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="relative">
      <nav className="flex justify-end p-4">
        <button
          type="button"
          className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 px-6 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          로그인
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="relative bg-white rounded-2xl shadow-xl p-6 w-[400px]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-gray-900">로그인</h2>

              <div className="mt-4 min-h-[220px]">
                <AnimatePresence mode="wait">
                  {activeForm === "buttons" && renderButtons()}
                  {activeForm === "student" && renderStudentForm()}
                  {activeForm === "admin" && renderAdminForm()}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginModal;
