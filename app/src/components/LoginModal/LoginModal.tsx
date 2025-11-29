import React from 'react';
import ReactDOM from 'react-dom';
import '../../styles/modal.css';
import { useLoginModal } from '../../hooks/useLoginModal';
import LoginSelector from './LoginSelector';
import LoginForm from './LoginForm';

export default function LoginModal() {
  const { isOpen, close, step } = useLoginModal();

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={close}>✕</button>

        {step === 'select-type' && <LoginSelector />}
        {step === 'login-form' && <LoginForm />}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
