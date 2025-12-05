export type AssignmentStatus = 'success' | 'pending' | null;

export interface Assignment {
  id: number;
  class_id?: number;
  classroom_id?: number;
  student_id: string;
  session_no: number;
  image_url?: string | null;
  link_url?: string | null;
  text_content?: string | null;
  type?: 'image' | 'link' | 'text' | null;
  status?: string;
  created_at: string;
}

export interface AssignmentFeedback {
  id: number;
  assignment_id: number;
  content: string;
  created_at: string;
  admin_id?: string | null;
}
