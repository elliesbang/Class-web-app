import { useContext } from 'react';
import { LoginModalContext } from '../context/LoginModalContext';

export function useLoginModal() {
  return useContext(LoginModalContext);
}
