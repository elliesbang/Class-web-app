import { getStoredAuthUser } from '@/lib/authUser';
import type { Assignment } from '@/types/db';

export type AssignmentWithRelations = Assignment & {
  profiles?: { id?: string; name?: string | null; email?: string | null } | null;
  assignment_feedbacks?: { id: number; content?: string | null; created_at?: string | null; admin_id?: string | null }[];
};

type CreateAssignmentPayload = {
  classroom_id: number | string;
  student_id?: string;
  session_no: number;
  image_base64?: string | null;
  link_url?: string | null;
};

type ListAssignmentsParams = {
  classroom_id?: number | string;
  student_id?: string;
  session_no?: number | string;
};

const jsonFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getStoredAuthUser()?.token;
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const message = (await response.text()) || response.statusText || '요청에 실패했습니다.';
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
};

export const submitAssignment = async (payload: CreateAssignmentPayload): Promise<Assignment> => {
  const response = await jsonFetch<{ assignment: Assignment }>(
    '/api/assignments/create',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return response.assignment;
};

export const fetchAssignments = async (
  params: ListAssignmentsParams,
): Promise<AssignmentWithRelations[]> => {
  const searchParams = new URLSearchParams();
  if (params.classroom_id) searchParams.set('classroom_id', String(params.classroom_id));
  if (params.student_id) searchParams.set('student_id', params.student_id);
  if (params.session_no) searchParams.set('session_no', String(params.session_no));

  const query = searchParams.toString();
  const url = query ? `/api/assignments/list?${query}` : '/api/assignments/list';

  const response = await jsonFetch<{ assignments: AssignmentWithRelations[] }>(url, { method: 'GET' });
  return response.assignments ?? [];
};
