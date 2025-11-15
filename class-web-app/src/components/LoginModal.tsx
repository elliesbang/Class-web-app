import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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

type ActiveForm = "buttons" | "student" | "admin" | "vod";  // ✅ vod 추가

const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const [activeForm, setActiveForm] = useState<ActiveForm>("buttons");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const navigate = useNavigate();

  const closeModal = useCallback(() => {
    onClose();
    setActiveForm("buttons");
    setAdminPassword("");
  }, [onClose]);

  const handleAdminSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (adminPassword.trim() === "admin123") {
        localStorage.setItem("adminAuth", "true");
        window.dispatchEvent(new Event("admin-auth-change"));
        alert("관리자로 로그인되었습니다.");
        closeModal();
        navigate("/admin");
        return;
      }

      alert("비밀번호가 올바르지 않습니다.");
    },
    [adminPassword, closeModal, navigate]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

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
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 mt-4 w-full"
        onClick={() => setActiveForm("student")}
      >
        수강생   {/* 🔥 로그인 텍스트 제거 */}
      </button>

      <button
        type="button"
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
        onClick={() => setActiveForm("vod")}   // 🔥 VOD 버튼 제대로 표시
      >
        VOD
      </button>

      <button
        type="button"
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
        onClick={() => {
          setAdminPassword("");
          setActiveForm("admin");
        }}
      >
        관리자
      </button>
    </motion.div>
  );

  const renderBackButton = () => (
    <button
      type="button"
      className="absolute right-0 top-0 text-sm text-gray-500 hover:text-gray-700"
      onClick={() => {
        setActiveForm("buttons");
        setAdminPassword("");
      }}
    >
      ← 뒤로가기
    </button>
  );

  const renderStudentForm = () => (
    <motion.div key="student-form" variants={panelVariants}
      initial="hidden" animate="visible" exit="exit" className="relative"
    >
      {renderBackButton()}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-1">이름</label>
        <input className="border rounded-md w-full p-2 mb-3" />

        <label className="block text-sm font-medium mb-1">이메일</label>
        <input className="border rounded-md w-full p-2 mb-3" />

        <button className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full">
          로그인
        </button>
      </div>
    </motion.div>
  );

  const renderVodForm = () => (
    <motion.div key="vod-form" variants={panelVariants}
      initial="hidden" animate="visible" exit="exit" className="relative"
    >
      {renderBackButton()}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-1">이름</label>
        <input className="border rounded-md w-full p-2 mb-3" />

        <label className="block text-sm font-medium mb-1">이메일</label>
        <input className="border rounded-md w-full p-2 mb-3" />

        <button className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full">
          로그인
        </button>
      </div>
    </motion.div>
  );

  const renderAdminForm = () => (
    <motion.div key="admin-form"
      variants={panelVariants} initial="hidden" animate="visible" exit="exit"
      className="relative"
    >
      {renderBackButton()}
      <form className="mt-6" onSubmit={handleAdminSubmit}>
        <label className="block font-medium mb-1">관리자 비밀번호</label>
        <input
          type="password"
          className="border rounded-md w-full p-2 mb-3"
          value={adminPassword}
          onChange={(event) => setAdminPassword(event.target.value)}
        />

        <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full">
          로그인
        </button>
      </form>
    </motion.div>
  );

  return (
    <motion.div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={closeModal}
    >
      <motion.div className="bg-white rounded-2xl shadow-xl p-6 w-[400px]"
        variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">로그인</h2>

        <div className="mt-4 min-h-[220px]">
          <AnimatePresence mode="wait">
            {activeForm === "buttons" && renderButtons()}
            {activeForm === "student" && renderStudentForm()}
            {activeForm === "vod" && renderVodForm()}
            {activeForm === "admin" && renderAdminForm()}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginModal;