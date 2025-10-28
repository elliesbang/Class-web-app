import { ensureBaseSchema } from '../../_utils/index.js';

// ===== 기본 타입 정의 =====
type D1Result<T = unknown> = {
  success: boolean;
  error?: string;
  results?: T[];
  lastInsertRowid?: number;
  changes?: number;
};

interface D1PreparedStatement<T = unknown> {
  bind(...values: unknown[]): D1PreparedStatement<T>;
  first<TRecord = T>(): Promise<TRecord | null>;
  run<TRecord = unknown>(): Promise<D1Result<TRecord>>;
  all<TRecord = T>(): Promise<D1Result<TRecord>>;
}

interface D1Database {
  prepare<T = unknown>(query: string): D1PreparedStatement<T>;
  exec(query: string): Promise<D1Result>;
}

interface Env {
  DB: D1Database;
}

// ===== Raw 데이터 & 응답 구조 =====
type RawClassRow = {
  id: number;
  name: string;
  code: string | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  assignment_upload_time: string | null;
  assignment_upload_days: string | null;
  delivery_methods: string | null;
  is_active: number | string | null;
  created_at: string | null;
  updated_at: string | null;
  duration?: string | null; // ✅ duration 컬럼 추가
};

type ClassResponseRecord = {
  id: number;
  name: string;
  code: string;
  category: string;
  startDate: string | null;
  endDate: string | null;
  assignmentUploadTime: 'all_day' | 'same_day';