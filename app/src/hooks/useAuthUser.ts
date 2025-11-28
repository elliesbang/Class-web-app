import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useAuthUser() {
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      // 현재 세션 가져오기
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user;

      if (!sessionUser) {
        setAuthUser(null);
        return;
      }

      // 🔥 profiles.role 조회하기
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionUser.id)
        .single();

      setAuthUser({
        ...sessionUser,
        role: profile?.role ?? null,
      });
    };

    loadUser();

    // 로그인 / 로그아웃 감지
    const { data: listener } = supabase.auth.onAuthStateChange(
      async () => {
        await loadUser();
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return authUser;
}
