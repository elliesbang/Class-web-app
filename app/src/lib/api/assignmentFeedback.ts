import { getStoredAuthUser } from '@/lib/authUser';
import type { AssignmentFeedback } from '@/types/db';

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

type CreateAssignmentFeedbackPayload = {
  assignment_id: number;
  content: string;
};

export const createAssignmentFeedback = async (
  payload: CreateAssignmentFeedbackPayload,
): Promise<AssignmentFeedback> => {
  const response = await jsonFetch<{ feedback: AssignmentFeedback }>(
    '/api/assignmentFeedback/create',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return response.feedback;
};
