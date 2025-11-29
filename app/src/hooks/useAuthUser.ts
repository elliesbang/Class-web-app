import { useAuth } from '@/context/AuthContext';

export function useAuthUser() {
  return useAuth();
}
