import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useAuthUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!ignore) {
          setUser(user ?? null)
        }
      } catch (e) {
        if (!ignore) setUser(null)
      } finally {
        if (!ignore) setLoading(false) // 🔥 무조건 loading 종료
      }
    }

    load()

    // 로그인 상태 변경 리스너
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      ignore = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
