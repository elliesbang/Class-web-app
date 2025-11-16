import { jsonResponse, errorResponse } from '../utils/jsonResponse.js';
import { readSheet } from '../utils/sheets.js';

const STUDENT_RANGE = 'Students!A1:Z1000';
const VOD_RANGE = 'VodStudents!A1:Z1000';

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `student-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normaliseString = (value, fallback = '') => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (value == null) {
    return fallback;
  }
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : fallback;
};

const normaliseStudentRow = (row) => ({
  id: normaliseString(row.id || row.ID || row.Id || generateId()),
  name: normaliseString(row.name || row.이름 || '이름 미확인'),
  email: normaliseString(row.email || row.이메일 || ''),
  status: normaliseString(row.status || row.상태 || '상태 미정'),
  courseName: normaliseString(row.courseName || row.course || row.class || row.수강강의 || '미지정'),
  registeredAt: normaliseString(row.registeredAt || row.joinedAt || row.등록일 || row.가입일 || ''),
});

const normaliseVodRow = (row) => ({
  id: normaliseString(row.id || row.ID || row.Id || generateId()),
  name: normaliseString(row.name || row.이름 || '이름 미확인'),
  email: normaliseString(row.email || row.이메일 || ''),
  status: normaliseString(row.status || row.상태 || '상태 미정'),
  vodAccess: normaliseString(row.vodAccess || row.access || row.권한 || ''),
  subscriptionEndsAt: normaliseString(row.subscriptionEndsAt || row.endsAt || row.만료일 || ''),
});

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type');
    if (type === 'vod') {
      const rows = await readSheet(context.env, VOD_RANGE);
      return jsonResponse({ success: true, data: rows.map(normaliseVodRow) });
    }
    const rows = await readSheet(context.env, STUDENT_RANGE);
    return jsonResponse({ success: true, data: rows.map(normaliseStudentRow) });
  } catch (error) {
    console.error('[students] failed to load sheet', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to load students');
  }
}
