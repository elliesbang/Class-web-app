export type AssignmentStatus = 'success' | 'pending' | null;

export interface Assignment {
  id: number;
  classroom_id: number;
  student_id: string;
  session_no: number;
  image_url?: string | null;
  link_url?: string | null;
  status: string;
  created_at: string;
}

export interface AssignmentFeedback {
  id: number;
  assignment_id: number;
  content: string;
  created_at: string;
  admin_id?: string | null;
}
