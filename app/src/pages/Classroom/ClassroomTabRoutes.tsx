export function AssignmentTabRoute() {
  const { classId } = useParams();
  const [state, setState] = useState({
    classroom: null,
    sessions: [],
    assignments: [],
    loading: true,
    error: '',
  });

  useEffect(() => {
    if (!classId) return;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        // 1) 수업 정보 로드
        const { data: classroom, error: classErr } = await supabase
          .from('classroom')
          .select('*')
          .eq('id', classId)
          .single();

        if (classErr) throw classErr;

        // 2) 세션 정보 로드
        const { data: sessions } = await supabase
          .from('classroom_sessions')
          .select('*')
          .eq('classroom_id', classId)
          .order('session_no', { ascending: true });

        // 3) 과제 목록 로드
        const {
          data: { user }
        } = await supabase.auth.getUser();

        const { data: assignments } = await supabase
          .from('assignments')
          .select('*')
          .eq('classroom_id', classId)
          .eq('student_id', user?.id ?? '')
          .order('created_at', { ascending: false });

        setState({
          classroom,
          sessions: sessions ?? [],
          assignments: assignments ?? [],
          loading: false,
          error: '',
        });
      } catch (err: any) {
        setState({
          classroom: null,
          sessions: [],
          assignments: [],
          loading: false,
          error: err?.message || '수업 정보를 불러오지 못했습니다.',
        });
      }
    };

    load();
  }, [classId]);

  if (!classId) return null;

  return (
    <AssignmentTab
      classId={classId}
      classroom={state.classroom}
      sessions={state.sessions}
      assignments={state.assignments}
      loading={state.loading}
      error={state.error}
    />
  );
}