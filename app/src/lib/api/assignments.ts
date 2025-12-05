import { getAuthUser } from '@/lib/authUser';
import type { Assignment } from '@/types/db';

export type AssignmentWithRelations = Assignment & {
  profiles?: { id?: string; name?: string | null; email?: string | null } | null;
  assignment_feedbacks?: { id: number; content?: string | null; created_at?: string | null; admin_id?: string | null }[];
};

// -----------------------------
// ✔ payload 타입 (class_id 기반)
// -----------------------------
export type CreateAssignmentPayload = {
  class_id: number;
  student_id: string;
  session_no: number;
  content_type: 'image' | 'link' | 'text';
  image_base64?: string | null;
  link_url?: string | null;
  text_content?: string | null;
};

// -----------------------------
// ✔ list 파라미터 (class_id 기반)
// -----------------------------
type ListAssignmentsParams = {
  class_id: number;
  student_id?: string;
  session_no?: number;
};

// -----------------------------
// 공통 fetch wrapper
// -----------------------------
const jsonFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthUser()?.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
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

// -----------------------------
// ✔ 과제 제출
// -----------------------------
export const submitAssignment = async (payload: CreateAssignmentPayload): Promise<Assignment> => {
  const response = await jsonFetch<{ assignment: Assignment }>(
    '/api/assignments-submit',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return response.assignment;
};

// -----------------------------
// ✔ 과제 목록 조회
// -----------------------------
export const fetchAssignments = async (
  params: ListAssignmentsParams,
): Promise<AssignmentWithRelations[]> => {
  const searchParams = new URLSearchParams();

  searchParams.set('class_id', String(params.class_id));
  if (params.student_id) {
    searchParams.set('student_id', params.student_id);
  }
  if (params.session_no) {
    searchParams.set('session_no', String(params.session_no));
  }

  const query = searchParams.toString();
  const url = `/api/assignments-list?${query}`;

  const response = await jsonFetch<{ assignments: AssignmentWithRelations[] }>(url, {
    method: 'GET',
  });

  return response.assignments ?? [];
};
