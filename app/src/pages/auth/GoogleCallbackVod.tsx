import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { setAuthUser } from "@/lib/authUser";

export default function GoogleCallbackVod() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const user = session.user;

      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata.full_name,
        avatar_url: user.user_metadata.avatar_url,
        role: "vod"
      });

      setAuthUser({
        user_id: user.id,
        role: "vod",
        name: user.user_metadata.full_name,
        email: user.email,
        token: session.access_token,
      });

      navigate("/vod");
    };

    checkLogin();
  }, [navigate]);

  return <p>로그인 처리중...</p>;
}
