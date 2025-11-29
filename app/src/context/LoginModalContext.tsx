import { createContext, useState } from 'react';

export const LoginModalContext = createContext(null);

export default function LoginModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('select-type');
  const [userType, setUserType] = useState(null);

  const open = () => {
    setStep('select-type');
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  return (
    <LoginModalContext.Provider value={{ isOpen, open, close, step, setStep, userType, setUserType }}>
      {children}
    </LoginModalContext.Provider>
  );
}
