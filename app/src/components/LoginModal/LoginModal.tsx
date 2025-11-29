import ReactDOM from 'react-dom';
import { useLoginModal } from '../../hooks/useLoginModal';
import LoginSelector from './LoginSelector';
import LoginForm from './LoginForm';
import './modal.css';

export default function LoginModal() {
  const { isOpen, step, close } = useLoginModal();

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
